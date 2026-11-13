import { getRelevantDocumentChunksService } from "./toolService.js";

export const searchDocuments = async ({ question,userId }) => {
  const chunks = await getRelevantDocumentChunksService(question,userId, 5);
  return chunks.map((chunk) => ({
    text: chunk.text,
    fileName: chunk.metadata?.fileName,
  }));
};
