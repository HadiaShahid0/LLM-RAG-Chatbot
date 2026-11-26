import { createHash } from "crypto";
import redis from "../config/redis.js";

const CACHE_TTL = 300;

const generateRetrievalCacheKey = ({
  question,
  userId,
  tenantId,
  allowedDocumentIds,
  topK,
}) => {
  const queryHash = createHash("sha256")
    .update(question.trim().toLowerCase())
    .digest("hex");

  const documentHash = createHash("sha256")
    .update([...allowedDocumentIds].map(String).sort().join(","))
    .digest("hex");

  return `rag:retrieval:${tenantId}:${userId}:${queryHash}:${documentHash}:${topK}`;
};

export const getRetrievalCacheService = async (cacheKey) => {
  try {
    const cachedResults = await redis.get(cacheKey);
    if (!cachedResults) {
      console.log("RAG Retrieval Cache MISS");
      return null;
    }
    console.log("RAG Retrieval Cache HIT");
    return JSON.parse(cachedResults);
  } catch (error) {
    console.error("Retrieval Cache Failes", error.message);
    return null;
  }
};

export const saveRetrievalCacheService = async (params, results) => {
  try {
    const cacheKey = generateRetrievalCacheKey(params);
    await redis.set(cacheKey, JSON.stringify(results), {
      EX: CACHE_TTL,
    });

    console.log("RAG Retrieval Cache Saved");
  } catch (error) {
    console.error("Retrieval Cache Save Failed:", error.message);
  }
};

export const getRetrievalCacheKeyService = (params) => {
  return generateRetrievalCacheKey(params);
};
