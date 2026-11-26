import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { Op } from "sequelize";
import { randomUUID } from "crypto";

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
import supabase, { BUCKET_NAME } from "../config/supabase.js";
import {
  generateCacheKey,
  getCachedResponse,
  saveCachedResponse,
} from "../cacheServices/exactMatchCacheService.js";

import {
  getSemanticCachedResponse,
  saveSemanticCacheService,
} from "../cacheServices/semanticCacheService.js";

import { groqModel, model as geminiModel } from "../config/langchain.js";
const canUseSemanticCache = async ({
  userMessage,
  existingAssistantMessage,
  bypassCache,
}) => {
  if (bypassCache || existingAssistantMessage) return false;

  if (!userMessage.content?.trim()) return false;

  if (userMessage.filePath || userMessage.geminiFileUri) return false;

  const followUpPatterns =
    /\b(it|its|they|them|this|that|these|those|their|above|previous)\b|what about|tell me more|explain more|explain again|repeat that|why is that|how about/i;
  return !followUpPatterns.test(userMessage.content);
};

const isCacheSafeQuestion = (question) => {
  const unsafePatterns =
    /\b(latest|current|today|tomorrow|yesterday|now|recent|news|weather|search|look up|browse|internet|website|url|link|price|stock|exchange rate|uploaded|document|pdf|file|according to my document)\b/i;

  return !unsafePatterns.test(question || "");
};

const generateConversationTitle = async (content, selectedModel) => {
  const prompt = `
Generate a short title (2-5 words) for this conversation.

Return only the title.

User message: ${content}
`;

  const response =
    selectedModel === "groq"
      ? await groqModel.invoke(prompt)
      : await geminiModel.invoke(prompt);

  return String(response.content)
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
  userId,
  tenantId,
  selectedModel,
  res,
  existingAssistantMessage = null,
  bypassCache = false,
) => {
  const beforeMessageId = existingAssistantMessage ? userMessage.id : null;

  const { summary, recentContext } = await getConversationContextService(
    conversationId,
    userId,
    beforeMessageId,
    tenantId,
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

  if (userMessage.filePath && selectedModel === "groq") {
    const retrievedChunks = await getRelevantDocumentChunksService(
      userMessage.content,
      userId,
      tenantId,
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

  const cacheKey = generateCacheKey({
    userId,
    tenantId,
    model: selectedModel,
    question: userMessage.content.trim().toLowerCase(),
    version: "v2",
  });

  const cacheSafeQuestion = isCacheSafeQuestion(userMessage.content);

  const isCacheable =
    !bypassCache &&
    !existingAssistantMessage &&
    !userMessage.filePath &&
    !userMessage.geminiFileUri &&
    cacheSafeQuestion;

  const isSemanticCacheable =
    isCacheable &&
    (await canUseSemanticCache({
      userMessage,
      existingAssistantMessage,
      bypassCache,
    }));

  console.log("========== CACHE ELIGIBILITY ==========");
  console.log("Exact Cache Eligible:", isCacheable);
  console.log("Semantic Cache Eligible:", isSemanticCacheable);

  let aiResponseText;
  let cacheHit = false;
  let usedTools = false;
  let usedToolNames = [];

  if (isCacheable) {
    const cacheStart = Date.now();

    const cachedResponse = await getCachedResponse(cacheKey);

    console.log("Exact cache lookup:", Date.now() - cacheStart, "ms");

    if (cachedResponse) {
      const cacheData = JSON.parse(cachedResponse);

      aiResponseText = cacheData.content;
      cacheHit = true;

      console.log("Exact LLM Cache HIT");
    } else {
      console.log("Exact LLM Cache MISS");
    }
  }

  if (!cacheHit && isSemanticCacheable) {
    const cacheStart = Date.now();

    const semanticCachedResponse = await getSemanticCachedResponse({
      question: userMessage.content,
      userId,
      tenantId,
      model: selectedModel,
    });

    console.log("Semantic cache lookup:", Date.now() - cacheStart, "ms");

    if (semanticCachedResponse) {
      aiResponseText = semanticCachedResponse;
      cacheHit = true;
      console.log("Semantic Cache HIT");
    } else {
      console.log("Semantic LLM Cache Miss");
    }
  }

  if (!cacheHit) {
    const agentResponse = await generateGeminiResponseWithTools(
      conversationContext,
      selectedModel,
      userId,
      tenantId,
    );
    aiResponseText = agentResponse?.content || "";
    usedTools = agentResponse?.usedTools ?? true;
    console.log("Tools used: ", usedTools);
    console.log("Tool Names:", usedToolNames);
  }

  const assistantContent = await streamGeminiResponseService(
    aiResponseText,
    res,
  );

  if (!cacheHit && !usedTools && assistantContent) {
    if (isCacheable) {
      await saveCachedResponse(cacheKey, {
        content: assistantContent,
      });

      console.log("Exact LLM Response SAVED");
    }

    if (isSemanticCacheable) {
      await saveSemanticCacheService({
        question: userMessage.content,
        response: assistantContent,
        userId,
        tenantId,
        model: selectedModel,
      });

      console.log("Semantic LLM Response SAVED");
    }
  } else if (!cacheHit && usedTools) {
    console.log("LLM Response NOT CACHED: Tools were used");
  }
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
  tenantId,
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
      tenantId,
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

  let storagePath = null;
  let uploadedFile = null;

  if (file) {
    if (!file.buffer) {
      throw new Error("Uploaded file buffer is missing");
    }

    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

    storagePath = `${tenantId}/${userId}/${conversationId}/${randomUUID()}-${safeFileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  }

  try {
    if (file && selectedModel === "gemini") {
      uploadedFile = await uploadFileToGemini(file);
    }

    const userMessage = await Message.create({
      conversationId,
      role: "user",
      content: content ?? "",
      fileName: file?.originalname || null,
      fileType: file?.mimetype || null,
      fileSize: file?.size || null,
      filePath: storagePath,
      geminiFileUri: uploadedFile?.uri || null,
    });

    const assistantMessage = await generateAndSaveAssistantMessageService(
      conversationId,
      userMessage,
      userId,
      tenantId,
      selectedModel,
      res,
    );

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
      updateConversationSummaryService(conversationId, userId, tenantId).catch(
        (error) => {
          console.error("Summary update failed:", error);
        },
      );
    }

    return {
      userMessage,
      assistantMessage,
      attachment: file
        ? {
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            filePath: storagePath,
            geminiFileUri: uploadedFile?.uri || null,
          }
        : null,
    };
  } catch (error) {
    if (storagePath) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (deleteError) {
        console.error("Supabase cleanup failed:", deleteError.message);
      }
    }

    throw error;
  }
};

export const regenerateMessageService = async ({
  conversationId,
  userId,
  tenantId,
  messageId,
  selectedModel,
  res,
}) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId, tenantId },
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
    userId,
    tenantId,
    selectedModel,
    res,
    assistantMessage,
    true,
  );
};

export const getMessagesByConversationIdService = async (
  conversationId,
  userId,
  tenantId,
) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
      tenantId,
    },
  });
  if (!conversation) throw new Error("Conversation not found");

  const messages = await Message.findAll({
    where: { conversationId },
    order: [["createdAt", "ASC"]],
  });
  return messages;
};

export const getMessageByIdService = async (messageId, userId, tenantId) => {
  const message = await Message.findOne({
    where: { id: messageId },
    include: [
      {
        model: Conversation,
        where: {
          userId,
          tenantId,
        },
        attributes: [],
      },
    ],
  });
  if (!message) {
    throw new Error("Message not found");
  }
  return message;
};
