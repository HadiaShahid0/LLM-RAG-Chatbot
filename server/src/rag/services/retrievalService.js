import { generateQueryEmbeddingService } from "./embeddingService.js";
import {
  getDocumentCollectionService,
  COLLECTION_NAME,
} from "./vectorStoreServices.js";

export const retrieveRelevantChunksService = async ({
  question,
  tenantId,
  allowedDocumentIds,
  topK = 5,
}) => {
  if (!question.trim())
    throw new Error("Question cannot be empty");

  if (!tenantId) throw new Error("Tenant ID is required");


  if(!Array.isArray(allowedDocumentIds)) throw new Error("Authorized document Ids are required")

  if(allowedDocumentIds.length===0) return []

  const queryEmbedding = await generateQueryEmbeddingService(question);
  const qdrant = await getDocumentCollectionService();

  const results = await qdrant.query(COLLECTION_NAME, {
    query: queryEmbedding,
    limit: topK,
    filter: {
      must: [
        {
          key: "tenantId",
          match: { value: String(tenantId) },
        },
        {
          key: "documentId",
          match:{
            any:allowedDocumentIds.map(String)
          }
        }
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
      tenantId:chunk.metadata?.tenantId,
    })),
  );

  return retrievedChunks;
};
