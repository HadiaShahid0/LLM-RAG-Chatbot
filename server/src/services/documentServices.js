import fs from "fs/promises";
import Document from "../models/documentModel.js";

import { storePDFInQdrantService } from "../rag/services/documentServices.js";
import {
  getDocumentCollectionService,
  COLLECTION_NAME,
} from "../rag/services/vectorStoreServices.js";
import { cleanPDFTextService } from "../rag/services/chunkServices.js";
import { extractTextFromPDFService } from "../rag/services/pdfService.js";
import { model } from "../config/langchain.js";
import { searchDocuments } from "../tools/toolRegistoery.js";

import supabase, {BUCKET_NAME} from "../config/supabase.js";
export const getDocumentsService = async (userId) => {
  return await Document.findAll({
    where: { userId },
    attributes: [
      "id",
      "fileName",
      "fileSize",
      "status",
      "summary",
      "topics",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });
};

export const processDocumentService = async (documentId) => {
  const document = await Document.findByPk(documentId);

  if (!document) throw new Error("Document not found");

  try {
    await document.update({ status: "processing" });

    // Download PDF from Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(document.filePath);

    if (error) throw error;

    const fileBuffer = Buffer.from(await data.arrayBuffer());

    // Extract PDF text
    const extractedDocuments =
      await extractTextFromPDFService(fileBuffer);

    const cleanedDocuments =
      cleanPDFTextService(extractedDocuments);

    const fullText = cleanedDocuments
      .map((item) => item.pageContent)
      .join("\n");

    // Generate summary and topics
    const metadata =
      await generateDocumentMetadataService(fullText);

    await document.update({
      summary: metadata.summary,
      topics: metadata.topics,
    });

    // Store extracted PDF chunks in Qdrant
    await storePDFInQdrantService({
      extractedDocuments,
      documentId: document.id,
      fileName: document.fileName,
      userId: document.userId,
    });

    await document.update({ status: "completed" });

    console.log("Document processing completed:", documentId);
  } catch (error) {
    console.error("PDF processing failed:", error);

    await document.update({ status: "failed" });

    throw error;
  }
};


export const deleteDocumentService = async (documentId, userId) => {
  const document = await Document.findOne({
    where: {
      id: documentId,
      userId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const qdrant = await getDocumentCollectionService();

  // Delete PDF chunks from Qdrant
  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: "documentId",
          match: { value: String(documentId) },
        },
        {
          key: "userId",
          match: { value: String(userId) },
        },
      ],
    },
    wait: true,
  });

  // Delete original PDF from Supabase
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([document.filePath]);

  if (error) {
    throw error;
  }

  // Delete document record from TiDB
  await document.destroy();

  return {
    message: "Document deleted successfully",
  };
};

export const generateDocumentMetadataService = async (text) => {
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

  const cleanedContent = content
    .replace(/```/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanedContent);
};

export const getDocumentCatalogService = async (userId) => {
  const documents = await getDocumentsService(userId);
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
  conversationContext = "",
) => {
  const documents = await getDocumentCatalogService(userId);
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
    const response = await model.invoke(prompt);

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
  conversationContext = "",
) => {
  const shouldSearchDocuments = await routeDocumentQuestionService(
    question,
    userId,
    conversationContext,
  );

  console.log("========== DOCUMENT ROUTING ==========");
  console.log("Question:", question);
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
  });

  console.log("Retrieved Results:", results);

  return {
    shouldSearchDocuments: true,
    results: results || [],
  };
};
