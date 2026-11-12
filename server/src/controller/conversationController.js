import {
  createConversationService,
  getConversationService,
  getUserConversationsService,
  deleteConversationService
} from "../services/conversationServices.js";

export const createConversation = async (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;
  try {
    const conversation = await createConversationService(userId, title);
    res
      .status(201)
      .json({ message: "Conversation created successfully", conversation });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating conversation", error: err.message });
  }
};

export const getUserConversation = async (req, res) => {
  const userId = req.user.id;
  try {
    const getUserConversations = await getUserConversationsService(userId);
    res
      .status(200)
      .json({
        message: "User conversation fetched successfully",
        getUserConversations,
      });
  } catch (err) {
    res
      .status(400)
      .json({
        message: "Error fetching user conversations",
        error: err.message,
      });
  }
};

export const getConversation = async (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.id;
  try {
    const getConversation = await getConversationService(
      conversationId,
      userId,
    );
    res
      .status(200)
      .json({ message: "Conversation fetched successfully", getConversation });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error fetching conversation", error: err.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    console.log("User ID:", userId);
    console.log("Conversation ID:", conversationId);

    const result = await deleteConversationService(
      userId,
      conversationId,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete controller error:", error);

    res.status(400).json({ error: error.message });
  }
};
