import Document from "../models/documentModel.js";
import DocumentPermission from "../models/documentPermissionModel.js";
import TenantMember from "../models/tenantMemberModel.js";
import {
  getDocumentsService,
  processDocumentService,
  deleteDocumentService,
  uploadDocumentService,
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
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please Select a PDF File",
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

    const document = await uploadDocumentService({
      file: req.file,
      userId: req.user.id,
      tenantId: req.tenant.id,
      visibility: req.body.visibility || "private",
      permissions,
    });

    return res.status(202).json({
      success: true,
      message:
        "Document uploaded successfully. Processing has been added to the queue.",
      document,
    });
  } catch (error) {
    console.error("Document upload controller error:", error);

    return res.status(error.statusCode || 500).json({
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
