import Document from "../models/documentModel.js";

import DocumentPermission from "../models/documentPermissionModel.js";

import TenantMember from "../models/tenantMemberModel.js";

import { Op } from "sequelize";
import { randomUUID } from "crypto";

import { storePDFInQdrantService } from "../rag/services/documentServices.js";
import {
  getDocumentCollectionService,
  COLLECTION_NAME,
} from "../rag/services/vectorStoreServices.js";
import { cleanPDFTextService } from "../rag/services/chunkServices.js";
import { extractTextFromPDFService } from "../rag/services/pdfService.js";
import { model } from "../config/langchain.js";
import { searchDocuments } from "../tools/toolRegistoery.js";
import { getAuthorizedDocumentIdsService } from "./documentPermissionService.js";
import supabase, { BUCKET_NAME } from "../config/supabase.js";
import { model as geminiModel, groqModel } from "../config/langchain.js";

import { pdfQueue } from "../queues/pdfQueues.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const uploadDocumentService = async ({
  file,
  userId,
  tenantId,
  visibility = "private",
  permissions = [],
}) => {
  let storagePath, document;

  try {
    if (!file) throw createError("Please select a pdf file");

    const membership = await TenantMember.findOne({
      where: {
        userId,
        tenantId,
        status: "active",
      },
    });

    if (!membership)
      throw createError("You are not authorized to upload documents", 403);

    const allowedVisibility = ["private", "employee", "admin", "selected"];

    if (!allowedVisibility.includes(visibility))
      throw createError("Invalid document visibility");

    if (visibility === "selected") {
      if (!permissions.length)
        throw createError("Please select atleast one employee");

      const userIds = permissions.map(Number);

      if (
        userIds.some((id) => !Number.isInteger(id) || id <= 0) ||
        new Set(userIds).size !== userIds.length
      )
        throw createError("Invalid or duplicate employee IDs");

      const members = await TenantMember.findAll({
        where: {
          tenantId,
          userId: userIds,
          role: "employee",
          status: "active",
        },
      });

      if (members.length !== userIds.length)
        throw createError("One or more selected employees are invalid");
      permissions = userIds;
    }

    storagePath = `${tenantId}/${userId}/${randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    document = await Document.create({
      tenantId,
      userId,
      fileName: file.originalname,
      filePath: storagePath,
      fileSize: file.size,
      visibility,
      status: "pending",
    });

    if (visibility === "selected") {
      await DocumentPermission.bulkCreate(
        permissions.map((selectedUserId) => ({
          documentId: document.id,
          userId: selectedUserId,
          grantedBy: userId,
        })),
      );
    }

    await pdfQueue.add(
      "process-pdf",
      {
        documentId: document.id,
        userId,
        tenantId,
      },
      {
        jobId: `document-${document.id}`,
      },
    );
    return document;
  } catch (error) {
    console.log("Document upload service error:", error);

    if (document) {
      await DocumentPermission.destroy({
        where: { documentId: document.id },
      }).catch((cleanupError) => {
        console.error("Permission cleanup failed:", cleanupError.message);
      });
    }
    if (storagePath) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (removeError) {
        console.error("Supabase file cleanup failed:", removeError.message);
      }
    }

    throw error;
  }
};
export const getDocumentsService = async (userId, tenantId) => {
  const allowedDocumentIds = await getAuthorizedDocumentIdsService(
    userId,
    tenantId,
  );

  if (!allowedDocumentIds.length) return [];

  const documents = await Document.findAll({
    where: {
      id: { [Op.in]: allowedDocumentIds },
      tenantId,
    },
    attributes: [
      "id",
      "userId",
      "fileName",
      "fileSize",
      "visibility",
      "status",
      "summary",
      "topics",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  return documents.map((doc) => ({
    ...doc.toJSON(),
    isOwner: String(doc.userId) === String(userId),
  }));
};

export const processDocumentService = async ({
  documentId,
  tenantId,
  userId,
}) => {
  let document;

  try {
    console.log("PDF processing service received:", {
      documentId,
      tenantId,
      userId,
    });

    if (!documentId || !tenantId || !userId) {
      throw new Error("Missing documentId, tenantId, or userId");
    }

    document = await Document.findOne({
      where: {
        id: documentId,
        tenantId,
        userId,
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    await document.update({ status: "processing" });

    // Download PDF from Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(document.filePath);

    if (error) throw error;

    const fileBuffer = Buffer.from(await data.arrayBuffer());

    // Extract PDF text
    const extractedDocuments = await extractTextFromPDFService(fileBuffer);

    // Clean extracted text
    const cleanedDocuments = cleanPDFTextService(extractedDocuments);

    const fullText = cleanedDocuments
      .map((item) => item.pageContent)
      .join("\n");

    if (!fullText.trim()) {
      throw new Error("No readable PDF text found");
    }

    // Generate summary and topics
    const metadata = await generateDocumentMetadataService(fullText);

    await document.update({
      summary: metadata.summary,
      topics: metadata.topics,
    });

    // Store PDF chunks and embeddings in Qdrant
    await storePDFInQdrantService({
      extractedDocuments,
      documentId: document.id,
      tenantId,
      fileName: document.fileName,
      userId: document.userId,
    });

    // Mark document as completed
    await document.update({
      status: "completed",
    });

    console.log("Document processing completed:", documentId);
    console.log("Final document status:", document.status);

    return {
      success: true,
      documentId,
      status: document.status,
    };
  } catch (error) {
    console.error("PDF processing failed:", error);

    throw error;
  }
};

export const deleteDocumentService = async (documentId, userId, tenantId) => {
  const membership = await TenantMember.findOne({
    where: {
      userId,
      tenantId,
      status: "active",
    },
  });

  if (!membership)
    throw new Error("You are not authorized to access this workspace");

  const document = await Document.findOne({
    where: {
      id: documentId,
      tenantId,
    },
  });

  if (!document) throw new Error("Document not found");

  if (membership.role !== "admin" && String(document.userId) !== String(userId))
    throw new Error("You are not authorized to delete this document");

  const qdrant = await getDocumentCollectionService();

  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: "documentId",
          match: { value: String(documentId) },
        },
        {
          key: "tenantId",
          match: { value: String(tenantId) },
        },
      ],
    },
    wait: true,
  });

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([document.filePath]);

  if (error) throw error;

  await document.destroy();

  return {
    message: "Document deleted successfully",
  };
};

export const generateDocumentMetadataService = async (text) => {
  if (!text?.trim())
    throw new Error("Document text is required for metadata generation");

  const prompt = `
        Analyze the following PDF content.

Generate:
1. A short summary (2-3 sentences).
2. A list of important topics and concepts.

Return ONLY valid JSON in this format:

{
  "summary": "Short document summary",
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}

PDF CONTENT:
${text.slice(0, 15000)}
    `;

  const response = await model.invoke(prompt);

  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  const cleanedContent = content.trim();

  const startIndex = cleanedContent.indexOf("{");
  const endIndex = cleanedContent.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1)
    throw new Error("Invalid JSON response from metadata generation");

  const jsonContent = cleanedContent.slice(startIndex, endIndex + 1);

  const metadata = JSON.parse(jsonContent);

  if (typeof metadata.summary !== "string" || !Array.isArray(metadata.topics))
    throw new Error("Invalid document metadata format");

  return {
    summary: metadata.summary,
    topics: metadata.topics,
  };
};

export const getDocumentCatalogService = async (userId, tenantId) => {
  const documents = await getDocumentsService(userId, tenantId);
  return documents
    .filter((document) => document.status === "completed")
    .map((document) => ({
      id: document.id,
      fileName: document.fileName,
      summary: document.summary,
      topics: document.topics || [],
    }));
};

export const routeDocumentQuestionService = async (
  question,
  userId,
  tenantId,
  conversationContext = "",
  selectedModel = "gemini",
) => {
  const documents = await getDocumentCatalogService(userId, tenantId);
  if (Array.isArray(question)) {
    question = question.map((item) => item.text || "").join("\n");
  }
  if (!documents.length) {
    console.log("No completed documents found.");
    return false;
  }
  console.log("========== CLASSIFIER INPUT ==========");
  console.log("Question:", question);
  console.log("Document Catalog:", JSON.stringify(documents, null, 2));
  console.log("======================================");
  const prompt = `
You are a document relevance classifier.

Your task is to decide whether the user's question is relevant
to the uploaded documents.

DOCUMENT CATALOG:
${JSON.stringify(documents, null, 2)}

PREVIOUS CONVERSATION:
${conversationContext || "No previous conversation."}

CURRENT USER QUESTION:
${question}

CLASSIFICATION RULES:

1. Compare the meaning of the current question with the summary
   and topics of the uploaded documents.

2. Return true if the question is about a concept, topic, or
   information that is covered by the document summary or topics.

3. Semantic matching is important.
   Do not require the user's exact words to appear in the catalog.

4. Do not classify a question as relevant just because a document
   briefly mentions a related keyword.

5. If the question asks for a comparison, the documents must
   cover the relevant subjects sufficiently.

6. Give priority to the current question.
   Do not use previous conversation topics to classify a
   complete and independent question.

7. Use previous conversation only to understand incomplete
   follow-up questions such as:
   - What are its types?
   - Explain the second point.
   - What is its purpose?

8. If the question does not match any document's summary or
   topics, return false.

9. Do not assume that a document contains information that
   is not indicated by its summary or topics.

EXAMPLES:

Document topics: ["EDA", "Data Cleaning", "Data Visualization"]

Question: "Explain exploratory data analysis."
Result: true

Question: "What are the different types of EDA?"
Result: true

Question: "Explain REST API vs GraphQL."
Result: false

Question: "What is JavaScript?"
Result: false

Question: "Explain data visualization techniques."
Result: true

RETURN FORMAT:

Return ONLY valid JSON. Do not include explanations.

{
  "shouldSearchDocuments": true
}
`;

  try {
    const selectedLLMModel = selectedModel === "groq" ? groqModel : geminiModel;
    const response = await selectedLLMModel.invoke(prompt);

    const content =
      typeof response.content === "string"
        ? response.content
        : response.content.map((item) => item.text || "").join("");

    const cleanedContent = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(cleanedContent);

    console.log("Document Classification:", result);

    return result.shouldSearchDocuments === true;
  } catch (error) {
    console.error("Document routing failed:", error);
    return false;
  }
};

export const retrieveDocumentContextService = async (
  question,
  userId,
  tenantId,
  conversationContext = "",
  selectedModel = "gemini",
) => {
  if (!userId || !tenantId)
    throw new Error("User Id and TenantId are required");

  const shouldSearchDocuments = await routeDocumentQuestionService(
    question,
    userId,
    tenantId,
    conversationContext,
    selectedModel,
  );
  console.log("========== DOCUMENT ROUTING ==========");
  console.log("Question:", question);
  console.log("Tenant Id:", tenantId);
  console.log("Search Documents:", shouldSearchDocuments);

  if (!shouldSearchDocuments) {
    console.log("Using general LLM response.");

    return {
      shouldSearchDocuments: false,
      results: [],
    };
  }

  console.log("Searching uploaded documents...");

  const results = await searchDocuments({
    question,
    userId,
    tenantId,
  });

  console.log("Retrieved Results:", results);

  return {
    shouldSearchDocuments: true,
    results: results || [],
  };
};
