import Document from "../models/documentModel.js";
import DocumentPermission from "../models/documentPermissionModel.js";
import TenantMember from "../models/tenantMemberModel.js";
import {
  getDocumentsService,
  processDocumentService,
  deleteDocumentService,
} from "../services/documentServices.js";
import { randomUUID } from "crypto";
import supabase, { BUCKET_NAME } from "../config/supabase.js";

export const getDocumentsController = async (req, res) => {
  try {
    const documents = await getDocumentsService(req.user.id, req.tenant.id);
    res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const uploadDocumentController = async (req, res) => {
  let storagePath;
  let document;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please select a PDF file",
      });
    }

    const membership = await TenantMember.findOne({
      where: {
        userId: req.user.id,
        tenantId: req.tenant.id,
        status: "active",
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to upload documents",
      });
    }

    const visibility = req.body.visibility || "private";
    const allowedVisibility = ["private", "employee", "admin", "selected"];

    if (!allowedVisibility.includes(visibility)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document visibility",
      });
    }
    let permissions = [];

    try {
      permissions = req.body.permissions
        ? JSON.parse(req.body.permissions)
        : [];
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid permissions format",
      });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: "Permissions must be an array",
      });
    }

    if (visibility === "selected") {
      if (!permissions.length) {
        return res.status(400).json({
          success: false,
          error: "Please select at least one employee",
        });
      }
      const userIds = permissions.map(Number);

      if (
        userIds.some((id) => !Number.isInteger(id) || id <= 0) ||
        new Set(userIds).size !== userIds.length
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid or duplicate employee IDs",
        });
      }

      const members = await TenantMember.findAll({
        where: {
          tenantId: req.tenant.id,
          userId: userIds,
          role: "employee",
          status: "active",
        },
      });

      if (members.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          error: "One or more selected employees are invalid",
        });
      }
      permissions = userIds;
    }

    storagePath = `${req.tenant.id}/${req.user.id}/${randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, req.file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    document = await Document.create({
      tenantId: req.tenant.id,
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: storagePath,
      fileSize: req.file.size,
      visibility,
      status: "processing",
    });

    if (visibility === "selected") {
      await DocumentPermission.bulkCreate(
        permissions.map((selectedUserId) => ({
          documentId: document.id,
          userId: selectedUserId,
          grantedBy: req.user.id,
        })),
      );
    }

    processDocumentService(document.id, req.tenant.id).catch((error) => {
      console.error("Background document processing error:", error);
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Document upload failed:", error);

    if (document) {
      await DocumentPermission.destroy({
        where: { documentId: document.id },
      }).catch(console.error);

      await document.destroy().catch(console.error);
    }

    if (storagePath) {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath])
        .catch(console.error);
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to upload document",
    });
  }
};

export const deleteDocumentController = async (req, res) => {
  try {
    const result = await deleteDocumentService(
      req.params.id,
      req.user.id,
      req.tenant.id,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode =
      error.message === "Document not found"
        ? 404
        : error.message.includes("not authorized")
          ? 403
          : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};
