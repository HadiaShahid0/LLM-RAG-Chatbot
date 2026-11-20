import { Message, Conversation } from "../models/index.js";
import { model } from "../config/langchain.js";
import { Op } from "sequelize";
import supabase, { BUCKET_NAME } from "../config/supabase.js";

// Create conversation
export const createConversationService = async (userId, tenantId, title) => {
  const conversation = await Conversation.create({
    userId,
    tenantId,
    title: title || "New Chat",
  });

  return conversation;
};

// Get conversations belonging to the user in the active tenant
export const getUserConversationsService = async (userId, tenantId) => {
  const conversations = await Conversation.findAll({
    where: {
      userId,
      tenantId,
    },
    order: [["updatedAt", "DESC"]],
  });

  return conversations;
};

// Get one conversation
export const getConversationService = async (
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

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
};

// Update conversation summary
export const updateConversationSummaryService = async (
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

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const whereCondition = { conversationId };

  if (conversation.lastSummarizedMessageId) {
    whereCondition.id = {
      [Op.gt]: conversation.lastSummarizedMessageId,
    };
  }

  const messages = await Message.findAll({
    where: whereCondition,
    order: [["createdAt", "ASC"]],
  });

  if (!messages.length) {
    return conversation.summary || "";
  }

  const conversationText = messages
    .map((message) => {
      const role = message.role === "user" ? "User" : "Assistant";
      return `${role}: ${message.content}`;
    })
    .join("\n");

  const prompt = `
You are updating a conversation summary.

Previous summary:
${conversation.summary || "No previous summary."}

New messages:
${conversationText}

Create an updated summary.

Keep:
- Important topics
- Important questions
- Important answers
- User preferences
- Decisions
- Important facts
- Ongoing tasks

Do not invent information. Keep the wording simple and the summary short.
Return only the updated summary, without headings or additional explanations.
`;

  const summaryResponse = await model.invoke(prompt);

  const summaryText =
    typeof summaryResponse.content === "string"
      ? summaryResponse.content
      : summaryResponse.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("");

  const lastMessage = messages[messages.length - 1];

  await conversation.update({
    summary: summaryText,
    lastSummarizedMessageId: lastMessage.id,
  });

  return summaryText;
};

// Get conversation context for AI
export const getConversationContextService = async (
  conversationId,
  userId,
  beforeMessageId = null,
  tenantId,
) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
      tenantId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const where = { conversationId };

  if (beforeMessageId) {
    where.id = {
      [Op.lt]: beforeMessageId,
    };
  }

  const previousMessages = await Message.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: 5,
  });

  previousMessages.reverse();

  const recentContext = previousMessages.map((message) => {
    const parts = [];

    if (message.content) {
      parts.push({
        text: message.content,
      });
    }

    if (message.geminiFileUri && message.fileType) {
      parts.push({
        fileData: {
          fileUri: message.geminiFileUri,
          mimeType: message.fileType,
        },
      });
    }

    return {
      role: message.role === "user" ? "user" : "model",
      parts,
    };
  });

  return {
    summary: conversation.summary || "",
    recentContext,
  };
};

// Delete conversation
export const deleteConversationService = async (
  userId,
  conversationId,
  tenantId,
) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
      tenantId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Get attachment paths belonging to this conversation
  const messages = await Message.findAll({
    where: { conversationId },
    attributes: ["filePath"],
  });

  const storagePaths = [
    ...new Set(
      messages.map((message) => message.filePath).filter(Boolean),
    ),
  ];

  // Delete attachments from Supabase Storage
  if (storagePaths.length > 0) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(storagePaths);

    if (error) {
      throw new Error(`Supabase deletion failed: ${error.message}`);
    }
  }

  // Delete conversation
  await conversation.destroy();

  return {
    message: "Conversation deleted successfully",
  };
};