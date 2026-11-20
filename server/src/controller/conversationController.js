import {
  createConversationService,
  getConversationService,
  getUserConversationsService,
  deleteConversationService,
} from "../services/conversationServices.js";

// Create conversation
export const createConversation = async (req, res) => {
  try {
    const { title } = req.body;

    const conversation = await createConversationService(
      req.user.id,
      req.tenant.id,
      title,
    );

    res.status(201).json({
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error creating conversation",
      error: error.message,
    });
  }
};

// Get user's conversations
export const getUserConversation = async (req, res) => {
  try {
    const conversations = await getUserConversationsService(
      req.user.id,
      req.tenant.id,
    );

    res.status(200).json({
      message: "User conversations fetched successfully",
      getUserConversations: conversations,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error fetching user conversations",
      error: error.message,
    });
  }
};

// Get one conversation
export const getConversation = async (req, res) => {
  try {
    const conversation = await getConversationService(
      req.params.conversationId,
      req.user.id,
      req.tenant.id,
    );

    res.status(200).json({
      message: "Conversation fetched successfully",
      getConversation: conversation,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error fetching conversation",
      error: error.message,
    });
  }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
  try {
    const result = await deleteConversationService(
      req.user.id,
      req.params.conversationId,
      req.tenant.id,
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};