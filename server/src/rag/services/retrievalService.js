import { generateQueryEmbeddingService } from "./embeddingService.js";
import { getDocumentCollectionService } from "./vectorStoreServices.js";

export const retrieveRelevantChunksService = async ({ question, userId, topK = 5 }) => {
  if (!question?.trim()) throw new Error("Question cannot be empty");

  if(!userId) throw new Error("Question cannot be empty")
  const queryEmbedding = await generateQueryEmbeddingService(question);

  const collection = await getDocumentCollectionService();

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: {
      userId: String(userId)
    },
  });

  const ids = results.ids?.[0] || [];
  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  const retrievedChunks = documents.map((text, index) => ({
    id: ids[index],
    text,
    metadata: metadatas[index],
    distance: distances[index],
  }));
  console.log("\n========== VECTOR SEARCH RESULTS ==========");
  console.log("Question:", question);
  console.log("Retrieved chunks:", retrievedChunks.length);

  console.table(
    retrievedChunks.map((chunk, index) => ({
      rank: index + 1,
      id: chunk.id,
      distance: chunk.distance,
      fileName: chunk.metadata?.fileName,
    })),
  );

  return retrievedChunks;
};
