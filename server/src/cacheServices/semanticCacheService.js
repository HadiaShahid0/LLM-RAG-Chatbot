import { randomUUID } from "crypto";

import qdrant, {
  SEMANTIC_CACHE_COLLECTION,
  getSemanticCacheCollectionService,
} from "../rag/services/vectorStoreServices.js";

import redis from "../config/redis.js";

import { generateQueryEmbeddingService } from "../rag/services/embeddingService.js";

const SIMILARITY_THRESHOLD = 0.8;
const CACHE_TTL = 3600;

export const getSemanticCachedResponse = async ({
  question,
  userId,
  tenantId,
  model,
}) => {
  try {
    const questionEmbedding = await generateQueryEmbeddingService(
      question,
      tenantId,
    );

    await getSemanticCacheCollectionService();

    const searchResponse = await qdrant.query(SEMANTIC_CACHE_COLLECTION, {
      query: questionEmbedding,
      limit: 5,
      with_payload: true,
      filter: {
        must: [
          {key: "userId",match: { value: String(userId) },},
          {key: "tenantId",match: { value: String(tenantId) },},
          {key: "model",match: { value: model }},
        ],
        must_not: [
          {key: "expiresAt",range: { lte: Date.now() },},
        ],
      },
    });

    const results = searchResponse.points || [];

    console.log(
      "Semantic Search Results:",
      results.map((result) => ({
        question: result.payload.question,
        similarity: result.score,
        cacheKey: result.payload.cacheKey,
      })),
    );
    if (!results.length) {
      console.log("Semantic Cache MISS");
      return null;
    }

    const matchedResult = results[0];

    for (const result of results) {
      if (result.score < SIMILARITY_THRESHOLD) break;

      const { cacheKey, expiresAt } = result.payload;

      if (expiresAt <= Date.now()) {
        await qdrant.delete(SEMANTIC_CACHE_COLLECTION, {
          points: [result.id],
          wait: true,
        });

        console.log("Expired Qdrant Cache Point Deleted");
        continue;
      }

      const cachedResponse = await redis.get(cacheKey);

      if (!cachedResponse) {
        await qdrant.delete(SEMANTIC_CACHE_COLLECTION, {
          points: [result.id],
          wait: true,
        });

        console.log("Expired Redis Cache Point Deleted");
        continue;
      }

      console.log("Semantic Cache HIT");
      console.log("Similarity:", result.score);

      return JSON.parse(cachedResponse).content;
    }

    console.log("Semantic Cache MISS");
    console.log("Similarity:", matchedResult.score);

    return null;
  } catch (error) {
    console.error("Semantic Cache Retrieval Failed", error);
    return null;
  }
};

export const saveSemanticCacheService = async ({
  question,
  response,
  userId,
  tenantId,
  model,
}) => {
  try {
    const questionEmbedding = await generateQueryEmbeddingService(
      question,
      tenantId,
    );

    await getSemanticCacheCollectionService();

    const cacheId = randomUUID();
    const cacheKey = `semantic:${cacheId}`;

    await redis.set(cacheKey, JSON.stringify({ content: response }), {
      EX: CACHE_TTL,
    });

    await qdrant.upsert(SEMANTIC_CACHE_COLLECTION, {
      points: [
        {
          id: cacheId,
          vector: questionEmbedding,
          payload: {
            question,
            userId: String(userId),
            tenantId: String(tenantId),
            model,
            cacheKey,
            expiresAt: Date.now() + CACHE_TTL * 1000,
          },
        },
      ],
    });
    console.log("Saving semantic question:", question);
    console.log("Semantic cache model:", model);
    console.log("Semantic cache user:", userId);
    console.log("Semantic cache tenant:", tenantId);
    console.log("Semantic Cache Saved");
  } catch (error) {
    console.error("Semantic Cache Saving Failed", error);
  }
};
