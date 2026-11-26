import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createHash } from "crypto";
import redis from "../config/redis.js";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 3072;
const CACHE_TTL = 86400;
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: EMBEDDING_MODEL,
  outputDimensionality: EMBEDDING_DIMENSIONS,
});

const generateEmbeddingCacheKey = (text, taskType, tenantId) => {
  const textHash = createHash("sha256").update(text).digest("hex");

  return `embedding:${EMBEDDING_MODEL}:${taskType}:${tenantId}:${textHash}`;
};

const getCachedEmbedding = async (cacheKey) => {
  try {
    const cachedEmbedding = await redis.get(cacheKey);
    if (!cachedEmbedding) return null;

    const embedding = JSON.parse(cachedEmbedding);

    if (
      !Array.isArray(embedding) ||
      embedding.length !== EMBEDDING_DIMENSIONS
    ) {
      await redis.del(cacheKey);
      return null;
    }

    console.log("Embedding Cache HIT");
    return embedding;
  } catch (error) {
    console.error("Embedding Cache Retrieval Failed:", error.message);
    return null;
  }
};

const saveEmbeddingCache = async (cacheKey, embedding) => {
  try {
    await redis.set(cacheKey, JSON.stringify(embedding), {
      EX: CACHE_TTL,
    });
    console.log("Embedding Saved in Redis");
  } catch (error) {
    console.error("Embedding Cache Save Failed", error.message);
  }
};
export const generateEmbeddingWithCache = async ({
  text,
  taskType,
  tenantId,
  generateEmbedding,
}) => {
  const normalizedText = text.trim();

  const cacheKey = generateEmbeddingCacheKey(
    normalizedText,
    taskType,
    tenantId,
  );

  const cachedEmbedding = await getCachedEmbedding(cacheKey);

  if (cachedEmbedding) return cachedEmbedding;
  console.log("Embedding Cache MISS");

  const embedding = await generateEmbedding(normalizedText);

  await saveEmbeddingCache(cacheKey, embedding);

  return embedding;
};
