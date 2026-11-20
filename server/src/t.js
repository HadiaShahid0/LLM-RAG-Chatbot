import Document from "../models/documentModel.js";
import DocumentPermission from "../models/documentPermissionModel.js";
import TenantMember from "../models/tenantMemberModel.js";
import { Op } from "sequelize";

export const getAuthorizedDocumentIdsService = async (
  userId,
  tenantId,
) => {
  const membership = await TenantMember.findOne({
    where: {
      userId,
      tenantId,
      status: "active",
    },
  });

  if (!membership) {
    throw new Error("You are not an active member of this workspace.");
  }

  // Every user can access their own documents.
  const accessConditions = [{ userId }];

  if (membership.role === "admin") {
    // Admins can access shared employee, admin and selected documents.
    // They cannot access another user's private documents.
    accessConditions.push({
      visibility: {
        [Op.in]: ["employee", "admin", "selected"],
      },
    });
  } else {
    // Employees can access documents shared with all employees.
    accessConditions.push({
      visibility: "employee",
    });

    // Find documents shared specifically with this employee.
    const permissions = await DocumentPermission.findAll({
      where: {
        userId,
      },
      attributes: ["documentId"],
    });

    const selectedDocumentIds = permissions.map(
      (permission) => permission.documentId,
    );

    if (selectedDocumentIds.length > 0) {
      accessConditions.push({
        visibility: "selected",
        id: {
          [Op.in]: selectedDocumentIds,
        },
      });
    }
  }

  const documents = await Document.findAll({
    where: {
      tenantId,
      status: "completed",
      [Op.or]: accessConditions,
    },
    attributes: ["id"],
  });

  return documents.map((document) => document.id);
};