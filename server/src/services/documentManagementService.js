import Document from "../models/documentModel.js";
import DocumentPermission from "../models/documentPermissionModel.js";
import TenantMember from "../models/tenantMemberModel.js";
import db from "../config/db.js";

export const updateDocumentVisibilityService = async (
  documentId,
  tenantId,
  userId,
  visibility,
  permissions = [],
) => {
  const allowedVisibility = ["private", "employee", "admin", "selected"];

  if (!allowedVisibility.includes(visibility)) {
    throw new Error("Invalid document visibility");
  }

  if (!Array.isArray(permissions)) {
    throw new Error("Permissions must be an array");
  }

  // Verify active workspace membership.
  const membership = await TenantMember.findOne({
    where: {
      userId,
      tenantId,
      status: "active",
    },
  });

  if (!membership) {
    throw new Error("You are not authorized to access this workspace");
  }

  const document = await Document.findOne({
    where: {
      id: documentId,
      tenantId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Only the uploader or a workspace admin can change access.
  if (
    membership.role !== "admin" &&
    String(document.userId) !== String(userId)
  ) {
    throw new Error("You are not authorized to manage this document");
  }

  // Validate selected employees.
  if (visibility === "selected") {
    if (!permissions.length) {
      throw new Error("Select at least one employee");
    }

    const userIds = permissions.map(Number);

    if (userIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new Error("Invalid employee ID");
    }

    if (new Set(userIds).size !== userIds.length) {
      throw new Error("Duplicate employees are not allowed");
    }

    const members = await TenantMember.findAll({
      where: {
        tenantId,
        userId: userIds,
        role: "employee",
        status: "active",
      },
    });

    if (members.length !== userIds.length) {
      throw new Error("One or more selected employees are invalid");
    }

    permissions = userIds;
  }

  await db.transaction(async (transaction) => {
    await document.update({ visibility }, { transaction });

    // Remove old permissions.
    await DocumentPermission.destroy({
      where: { documentId },
      transaction,
    });

    // Add permissions for selected employees.
    if (visibility === "selected") {
      await DocumentPermission.bulkCreate(
        permissions.map((selectedUserId) => ({
          documentId,
          userId: selectedUserId,
          grantedBy: userId,
        })),
        { transaction },
      );
    }
  });

  return {
    message: "Document permissions updated successfully",
    visibility,
  };
};
export const getDocumentAccessService = async (
  documentId,
  tenantId,
  userId,
) => {
  const membership = await TenantMember.findOne({
    where: {
      userId,
      tenantId,
      status: "active",
    },
  });

  if (!membership) {
    throw new Error("You are not authorized to access this workspace");
  }

  const document = await Document.findOne({
    where: {
      id: documentId,
      tenantId,
    },
    attributes: ["id", "userId", "fileName", "visibility"],
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Only uploader or workspace admin can manage access.
  if (
    membership.role !== "admin" &&
    String(document.userId) !== String(userId)
  ) {
    throw new Error("You are not authorized to manage this document");
  }

  const permissions = await DocumentPermission.findAll({
    where: { documentId },
    attributes: ["userId"],
  });

  return {
    document,
    permissions,
  };
};
