import User from "./userModel.js";
import Conversation from "./conversationModel.js";
import Message from "./messageModel.js";
import Document from "./documentModel.js";

User.hasMany(Conversation, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

Conversation.belongsTo(User, {
  foreignKey: "userId",
});

Conversation.hasMany(Message, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",
});

Message.belongsTo(Conversation, {
  foreignKey: "conversationId",
});

User.hasMany(Document, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

Document.belongsTo(User, {
  foreignKey: "userId",
});

export { User, Conversation, Message, Document };
