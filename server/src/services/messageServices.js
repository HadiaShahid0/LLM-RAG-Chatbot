import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { Op } from "sequelize";

import {
  validateUserInputService,
  validateAIInputService,
  MAX_AI_RESPONSE_LENGTH,
} from "./guardrailsServices.js";

import {
  getConversationContextService,
  updateConversationSummaryService,
} from "./conversationServices.js";

import { uploadFileToGemini } from "./geminiServices.js";

import { generateGeminiResponseWithTools } from "../agents/langchainAgent.js";
import { getRelevantDocumentChunksService } from "../tools/toolService.js";
const generateConversationTitle = async (content, selectedModel) => {
  const response = await generateGeminiResponseWithTools(
    [
      {
        role: "user",
        parts: [
          {
            text: `Generate a short title (2-5 words) for this conversation.

Rules:
- Identify the main topic.
- Do not copy the entire question.
- Do not include quotation marks.
- Return only the title.

User message: ${content}`,
          },
        ],
      },
    ],
    selectedModel,
  );

  return response
    .trim()
    .replace(/^["']|["']$/g, "")
    .slice(0, 50);
};

export const streamGeminiResponseService = async (aiResponse, res) => {
  const responseText =
    typeof aiResponse === "string"
      ? aiResponse
      : typeof aiResponse?.content === "string"
        ? aiResponse.content
        : "";

  const completeResponse = responseText.slice(0, MAX_AI_RESPONSE_LENGTH);

  const validatedResponse = validateAIInputService(completeResponse);

  if (validatedResponse) res.write(validatedResponse);
  return validatedResponse;
};

// export const retrievedChunksWithMMRService = async ({
//   question,
//   candidateCount = 10,
//   topK = 10,
// }) => {
//   const { queryEmbedding, chunks } = await retrieveRelevantChunksService({
//     question,
//     topK: candidateCount,
//   });
//   const selectedChunks = selectChunksWithMMR({
//     questionEmbedding: queryEmbedding,
//     chunks,
//     topK,
//     lambda: 0.7,
//   });
//   return selectedChunks.map(({ embedding, ...chunk }) => chunk);
// };

export const buildDocumentContextService = (chunks) => {
  if (!chunks.length) {
    return null;
  }

  const documentContext = chunks
    .map((chunk, index) => {
      return `Document Chunk ${index + 1}:\n${chunk.text}`;
    })
    .join("\n\n");

  return `
Relevant information retrieved from the provided document:

${documentContext}

Instructions:
- For questions about provided documents, base factual claims on the available document context.
- Do not invent facts or claim information is present when it is not.
- Do not use general knowledge to fill gaps in document-specific answers.
- If the context does not support an answer, clearly explain what information is missing.
- Combine information from multiple chunks when necessary.
- When listing items, include all matching items supported by the provided context.
- Avoid duplicate items.
- Use conversation history to understand follow-up questions when relevant, but do not treat it as proof of what a document contains.
- For unrelated general questions, answer normally using general knowledge.
- Do not mention chunks, embeddings, vector databases, or retrieval unless explicitly asked.
- Keep the answer focused on the user's question.
`;
};
const generateAndSaveAssistantMessageService = async (
  conversationId,
  userMessage,
  selectedModel,
  res,
  existingAssistantMessage = null,
) => {
  const beforeMessageId = existingAssistantMessage ? userMessage.id : null;

  const { summary, recentContext } = await getConversationContextService(
    conversationId,
    beforeMessageId,
  );

  const conversationContext = [];

  if (summary) {
    conversationContext.push({
      role: "user",
      parts: [
        {
          text: `Summary of earlier conversation:\n${summary}`,
        },
      ],
    });
  }

  conversationContext.push(...recentContext);

  if (existingAssistantMessage) {
    const usersParts = [];
    if (userMessage.content) {
      usersParts.push({
        text: userMessage.content,
      });
    }
    if (userMessage.geminiFileUri && userMessage.fileType) {
      usersParts.push({
        fileData: {
          fileUri: userMessage.geminiFileUri,
          mimeType: userMessage.fileType,
        },
      });
    }
    if (usersParts.length > 0) {
      conversationContext.push({
        role: "user",
        parts: usersParts,
      });
    }
  }
  // Retrieve document context for Groq attachments
  if (userMessage.filePath && selectedModel === "groq") {
    const retrievedChunks = await getRelevantDocumentChunksService(
      userMessage.content,
      5,
    );

    const documentContext = buildDocumentContextService(retrievedChunks);

    if (documentContext) {
      conversationContext.push({
        role: "user",
        parts: [{ text: documentContext }],
      });
    }
  }

  if (conversationContext.length === 0)
    throw new Error("Conversation context is empty");
  // Generate AI response
  const aiResponseText = await generateGeminiResponseWithTools(
    conversationContext,
    selectedModel,
  );

  const assistantContent = await streamGeminiResponseService(
    aiResponseText,
    res,
  );

  // Update existing message or create a new one
  if (existingAssistantMessage) {
    const previousVersions =
      existingAssistantMessage.versions?.length > 0
        ? existingAssistantMessage.versions
        : [existingAssistantMessage.content];
    const updatedVersions = [...previousVersions, assistantContent];

    await existingAssistantMessage.update({
      content: assistantContent,
      versions: updatedVersions,
      currentVersion: updatedVersions.length - 1,
    });
    return existingAssistantMessage;
  }

  return await Message.create({
    conversationId,
    role: "assistant",
    content: assistantContent,
    versions: [assistantContent],
    currentVersion: 0,
  });
};
export const createMessageService = async (
  conversationId,
  userId,
  content,
  file,
  selectedModel,
  res,
) => {
  validateUserInputService(content ?? "", file);

  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) throw new Error("Conversation not found.");

  const messageCount = await Message.count({
    where: {
      conversationId,
      role: "user",
    },
  });
  if (messageCount === 0 && content?.trim()) {
    const title = await generateConversationTitle(content, selectedModel);

    await conversation.update({ title });
  }
  let uploadedFile = null;

  if (file && selectedModel === "gemini")
    uploadedFile = await uploadFileToGemini(file);

  const userMessage = await Message.create({
    conversationId,
    role: "user",
    content: content ?? "",
    fileName: file?.originalname || null,
    fileType: file?.mimetype || null,
    fileSize: file?.size || null,
    filePath: file?.path || null,
    geminiFileUri: uploadedFile?.uri || null,
  });
  const assistantMessage = await generateAndSaveAssistantMessageService(
    conversationId,
    userMessage,
    selectedModel,
    res,
  );
  // const retrievedChunks = await getRelevantDocumentChunksService(
  //   content ?? "",
  //   5,
  // );

  // const documentContext = buildDocumentContextService(retrievedChunks);

  // if (documentContext) {
  //   conversationContext.push({
  //     role: "user",
  //     parts: [{ text: documentContext }],
  //   });
  // }

  // const aiResponse= await generateGeminiResponseStream(conversationContext, res);

  const lastSummarizedMessageId = conversation.lastSummarizedMessageId || 0;

  const unsummarizedCount = await Message.count({
    where: {
      conversationId,
      id: {
        [Op.gt]: lastSummarizedMessageId,
      },
    },
  });

  if (unsummarizedCount >= 5) {
    updateConversationSummaryService(conversationId).catch((error) => {
      console.error("Summary update failed:", error);
    });
  }

  return {
    userMessage,
    assistantMessage,
    attachment: uploadedFile
      ? {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: file.path,
          geminiFileUri: uploadedFile.uri,
        }
      : null,
  };
};

export const regenerateMessageService = async ({
  conversationId,
  userId,
  messageId,
  selectedModel,
  res,
}) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId },
  });
  if (!conversation) throw new Error("Conversation not found");

  const userMessage = await Message.findOne({
    where: { id: messageId, conversationId, role: "user" },
  });
  if (!userMessage) throw new Error("User message not found");
  const assistantMessage = await Message.findOne({
    where: {
      conversationId,
      role: "assistant",
      createdAt: {
        [Op.gte]: userMessage.createdAt,
      },
    },
    order: [
      ["createdAt", "ASC"],
      ["id", "ASC"],
    ],
  });

  if (!assistantMessage) throw new Error("Assistant message not found");

  return await generateAndSaveAssistantMessageService(
    conversationId,
    userMessage,
    selectedModel,
    res,
    assistantMessage,
  );
};
export const getMessagesByConversationIdService = async (
  conversationId,
  userId,
) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  const messages = await Message.findAll({
    where: { conversationId },
    order: [["createdAt", "ASC"]],
  });
  return messages;
};

export const getMessageByIdService = async (messageId, userId) => {
  const message = await Message.findOne({
    where: { id: messageId },
    include: [
      {
        model: Conversation,
        where: {
          userId,
        },
      },
    ],
  });
  if (!message) {
    throw new Error("Message not found");
  }
  return message;
};
