import User from "./userModel.js";
import Tenant from "./tenantModel.js";
import TenantMember from "./tenantMemberModel.js";
import Invitation from "./invitationModel.js";
import Document from "./documentModel.js";
import DocumentPermission from "./documentPermissionModel.js";
import Conversation from "./conversationModel.js";
import Message from "./messageModel.js";

// User and Tenant (Company)
User.hasMany(Tenant, {
  foreignKey: "createdBy",
  as: "createdTenants",
});

Tenant.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// Tenant and TenantMember
Tenant.hasMany(TenantMember, {
  foreignKey: "tenantId",
  onDelete: "CASCADE",
});

TenantMember.belongsTo(Tenant, {
  foreignKey: "tenantId",
});

User.hasMany(TenantMember, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

TenantMember.belongsTo(User, {
  foreignKey: "userId",
});

// Tenant and Invitation
Tenant.hasMany(Invitation, {
  foreignKey: "tenantId",
  onDelete: "CASCADE",
});

Invitation.belongsTo(Tenant, {
  foreignKey: "tenantId",
});

User.hasMany(Invitation, {
  foreignKey: "invitedBy",
});

Invitation.belongsTo(User, {
  foreignKey: "invitedBy",
  as: "inviter",
});

// Tenant and Documents
Tenant.hasMany(Document, {
  foreignKey: "tenantId",
  onDelete: "CASCADE",
});

Document.belongsTo(Tenant, {
  foreignKey: "tenantId",
});

User.hasMany(Document, {
  foreignKey: "userId",
});

Document.belongsTo(User, {
  foreignKey: "userId",
  as: "uploader",
});

// Document and DocumentPermission
Document.hasMany(DocumentPermission, {
  foreignKey: "documentId",
  onDelete: "CASCADE",
});

DocumentPermission.belongsTo(Document, {
  foreignKey: "documentId",
});

User.hasMany(DocumentPermission, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

DocumentPermission.belongsTo(User, {
  foreignKey: "userId",
});

// Tenant and Conversations
Tenant.hasMany(Conversation, {
  foreignKey: "tenantId",
  onDelete: "CASCADE",
});

Conversation.belongsTo(Tenant, {
  foreignKey: "tenantId",
});

User.hasMany(Conversation, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

Conversation.belongsTo(User, {
  foreignKey: "userId",
});

// Conversation and Messages
Conversation.hasMany(Message, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",
});

Message.belongsTo(Conversation, {
  foreignKey: "conversationId",
});

export {
  User,
  Tenant,
  TenantMember,
  Invitation,
  Document,
  DocumentPermission,
  Conversation,
  Message,
};
