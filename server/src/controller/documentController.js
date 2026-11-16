import path from "path";
import Document from "../models/documentModel.js";

import {
  getDocumentsService,
  processDocumentService,
  deleteDocumentService,
} from "../services/documentServices.js";
import { randomUUID } from "crypto";
import supabase, { BUCKET_NAME } from "../config/supabase.js";


export const getDocumentsController = async (req, res) => {
  try {
    const documents = await getDocumentsService(req.user.id);
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
  let uploaded = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please select a PDF file",
      });
    }

    // Create a unique storage path for each user's PDF
    storagePath = `${req.user.id}/${randomUUID()}.pdf`;

    // Upload PDF to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, req.file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    uploaded = true;

    // Save PDF metadata and storage path in TiDB
    const document = await Document.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: storagePath,
      fileSize: req.file.size,
      status: "processing",
    });

    processDocumentService(document.id).catch((error) => {
      console.error("Background document processing error:", error);
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    // Remove uploaded PDF if database record creation fails
    if (uploaded && storagePath) {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath])
        .catch(console.error);
    }

    console.error("Document upload failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteDocumentController = async (req, res) => {
  try {
    const result = await deleteDocumentService(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(error.message === "Document not found" ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
};
