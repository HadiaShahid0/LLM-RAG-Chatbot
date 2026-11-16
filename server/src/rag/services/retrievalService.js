import { generateQueryEmbeddingService } from "./embeddingService.js";
import {
  getDocumentCollectionService,
  COLLECTION_NAME,
} from "./vectorStoreServices.js";

export const retrieveRelevantChunksService = async ({
  question,
  userId,
  topK = 5,
}) => {
  if (typeof question !== "string" || !question.trim()) {
    throw new Error("Question cannot be empty");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const queryEmbedding = await generateQueryEmbeddingService(question);
  const qdrant = await getDocumentCollectionService();

  const results = await qdrant.query(COLLECTION_NAME, {
    query: queryEmbedding,
    limit: topK,
    filter: {
      must: [
        {
          key: "userId",
          match: { value: String(userId) },
        },
      ],
    },
    with_payload: true,
  });

  const retrievedChunks = (results.points || []).map((point) => {
    const { text, ...metadata } = point.payload || {};

    return {
      id: point.id,
      text,
      metadata,
      score: point.score,
    };
  });

  console.log("VECTOR SEARCH RESULTS");
  console.log("Question:", question);
  console.log("Retrieved chunks:", retrievedChunks.length);

  console.table(
    retrievedChunks.map((chunk, index) => ({
      rank: index + 1,
      id: chunk.id,
      score: chunk.score,
      fileName: chunk.metadata?.fileName,
    })),
  );

  return retrievedChunks;
};