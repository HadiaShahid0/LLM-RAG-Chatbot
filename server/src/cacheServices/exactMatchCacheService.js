import redis from "../config/redis.js";
import crypto from "crypto";

export const generateCacheKey = (data) => {
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");

  return `llm:${hash}`;
};

export const getCachedResponse = async (key) => {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error("Cache retrieval failed:", error);
    return null;
  }
};

export const saveCachedResponse = async (key, response) => {
  try {
    await redis.set(key, JSON.stringify(response), {
      EX: 3600,
    });
  } catch (error) {
    console.error("Cache saving failed:", error);
  }
};
