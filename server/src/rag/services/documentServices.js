import { createHash } from "crypto";

import { extractTextFromPDFService } from "./pdfService.js";

import {
  splitTextIntoChunksService,
  cleanPDFTextService,
} from "./chunkServices.js";

import { generateDocumentEmbeddingService } from "./embeddingService.js";

import {
  getDocumentCollectionService,
  COLLECTION_NAME,
} from "./vectorStoreServices.js";

const generateChunkId = (documentId, index) => {
  const hash = createHash("sha256")
    .update(`${documentId}-${index}`)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `a${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
};

export const storePDFInQdrantService = async ({
  fileBuffer,
  extractedDocuments,
  documentId,
  fileName,
  userId,
  tenantId,
}) => {
  if (
    (!fileBuffer && !extractedDocuments) ||
    !documentId ||
    !userId ||
    !tenantId
  )
    throw new Error("Required document information is missing");

  console.log("Extracting PDF text...");

  const documents =
    extractedDocuments || (await extractTextFromPDFService(fileBuffer));

  console.log("PDF text extracted successfully");
  console.log("Extracted text length:", documents[0]?.pageContent?.length);

  const cleanedDocuments = cleanPDFTextService(documents);

  console.log("Cleaned text length:", cleanedDocuments[0]?.pageContent?.length);

  const chunks = await splitTextIntoChunksService(cleanedDocuments, 1000, 200);

  if (!chunks.length) throw new Error("No Chunks Generated From PDF");

  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Generating embedding ${i + 1}/${chunks.length}...`);

    const embedding = await generateDocumentEmbeddingService(
      chunks[i].pageContent,
      tenantId
    );

    embeddings.push(embedding);
  }

  const collection = await getDocumentCollectionService();

  const points = chunks.map((chunk, index) => ({
    id: generateChunkId(documentId, index),

    vector: embeddings[index],

    payload: {
      text: chunk.pageContent,
      documentId: String(documentId),
      tenantId: String(tenantId),
      userId: String(userId),
      fileName,
      chunkIndex: index,
      pageNumber: chunk.metadata?.loc?.pageNumber || 0,
      scope: "tenant",
    },
  }));

  // Retrieve existing chunks for this document
  const existingData = await collection.scroll(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: "documentId",
          match: {
            value: String(documentId),
          },
        },
        {
          key: "tenantId",
          match: {
            value: String(tenantId),
          },
        },
      ],
    },

    limit: 10000,
    with_payload: false,
    with_vector: false,
  });

  // Store new chunks
  await collection.upsert(COLLECTION_NAME, {
    points,
    wait: true,
  });

  // Delete obsolete chunks
  const newIds = new Set(points.map((point) => point.id));

  const obsoleteIds = existingData.points
    .map((point) => point.id)
    .filter((id) => !newIds.has(id));

  if (obsoleteIds.length > 0) {
    await collection.delete(COLLECTION_NAME, {
      points: obsoleteIds,
      wait: true,
    });
  }

  console.log("PDF chunks stored successfully in Qdrant");

  return {
    documentId,
    tenantId,
    totalChunks: chunks.length,
  };
};
