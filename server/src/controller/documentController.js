import path from "path";
import Document from "../models/documentModel.js";

import {
  getDocumentsService,
  processDocumentService,
  deleteDocumentService,
} from "../services/documentServices.js";

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
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "Please select a PDF file",
      });
    }

    const document = await Document.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: path.resolve(req.file.path),
      fileSize: req.file.size,
      status: "processing",
    });

    processDocumentService(document.id).catch((error) => {
      console.error("Background document processing error: ", error);
    });
    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({
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
