import { getRelevantDocumentChunksService } from "./toolService.js";

export const searchDocuments = async ({ question,userId, tenantId }) => {
  if (!question?.trim()) throw new Error("Question cannot be empty");

  if (!tenantId) throw new Error("Tenant ID is required");

  const chunks = await getRelevantDocumentChunksService(question, userId, tenantId, 5);

  return chunks.map((chunk) => ({
    text: chunk.text,
    fileName: chunk.metadata?.fileName,
  }));
};
