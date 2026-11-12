import {
  createMessageService,
  getMessagesByConversationIdService,
  getMessageByIdService,
  regenerateMessageService,
} from "../services/messageServices.js";

export const createMessage = async (req, res) => {
  try {
    const { conversationId, content, model } = req.body;

    await createMessageService(
      conversationId,
      req.user.id,
      content,
      req.file,
      model,
      res,
    );
    res.end();
  } catch (error) {
    console.error("Error creating message:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Error creating message",
        error: error.message,
      });
    }
    res.end();
  }
};

export const regenerateMessage = async (req, res) => {
  try {
    const { conversationId, model } = req.body;
    const { messageId } = req.params;

    await regenerateMessageService({
      conversationId,
      userId: req.user.id,
      messageId,
      selectedModel: model,
      res,
    });
    res.end();
  } catch (error) {
    console.error("Error regenerating message", error);
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Error regenerating message",
        error: error.message,
      });
    }
    res.end();
  }
};
export const getMessagesByConversationId = async (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.id;
  try {
    const messages = await getMessagesByConversationIdService(
      conversationId,
      userId,
    );
    res
      .status(200)
      .json({ message: "Messages fetched successfully", messages });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching messages", error: err.message });
  }
};

export const getMessageById = async (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;
  try {
    const message = await getMessageByIdService(messageId, userId);
    res.status(200).json({ message: "Message fetched successfully", message });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching message", error: err.message });
  }
};
