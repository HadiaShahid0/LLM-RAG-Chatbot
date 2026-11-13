import fs from "fs/promises";
import Document from "../models/documentModel.js";

import { storePDFInChromaService } from "../rag/services/documentServices.js";
import { getDocumentCollectionService } from "../rag/services/vectorStoreServices.js";
export const getDocumentsService = async (userId) => {
  return await Document.findAll({
    where: { userId },
    attributes: ["id", "fileName", "fileSize", "status", "createdAt"],
    order: [["createdAt", "DESC"]],
  });
};

export const processDocumentService = async (documentId) => {
  const document = await Document.findByPk(documentId);

  if (!document) throw new Error("Document not found");

  try {
    await Document.update(
      { status: "processing" },
      { where: { id: documentId } },
    );

    await storePDFInChromaService({
      filePath: document.filePath,
      documentId: document.id,
      fileName: document.fileName,
      userId: document.userId,
    });

    await document.update({ status: "completed" });
  } catch (error) {
    console.error("PDF processing failed: ", error);

    await document.update({ status: "failed" });
  }
};

export const deleteDocumentService = async (documentId, userId) => {
  const document = await Document.findOne({
    where: {
      id: documentId,
      userId,
    },
  });

  if (!document) throw new Error("Document not found");
  const collection = await getDocumentCollectionService();

  const existingChunks = await collection.get({
    where: {
      $and: [{ documentId: String(documentId) }, { userId: String(userId) }],
    },
  });

  if (existingChunks.ids.length > 0) {
    await collection.delete({
      ids: existingChunks.ids,
    });
  }

  await fs.unlink(document.filePath).catch((error) => {
    if (error.code !== "ENOENT") throw errror;
  });

  await document.destroy();

  return { message: "Document deleted successfully" };
};
