import {generateEmbeddingWithCache,embeddings } from "../../cacheServices/embeddingCacheService.js"
export const generateDocumentEmbeddingService = async (
  text,
  tenantId = "shared",
) => {
  if (!text?.trim()) throw new Error("Document text cannot be empty");

  return generateEmbeddingWithCache({
    text,
    taskType: "RETRIEVAL_DOCUMENT",
    tenantId: String(tenantId),
    generateEmbedding: async (text) => {
      return (await embeddings.embedDocuments([text]))[0];
    },
  });
};

export const generateQueryEmbeddingService = async (
  question,
  tenantId = "shared",
) => {
  if (!question?.trim()) throw new Error("Question cannot be empty");

  return generateEmbeddingWithCache({
    text: question,
    taskType: "RETRIEVAL_QUERY",
    tenantId: String(tenantId),
    generateEmbedding: async (text) => {
      return await embeddings.embedQuery(text);
    },
  });
};
