import "dotenv/config";

import IORedis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing from environment variables");
}

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

connection.on("connect", () => {
  console.log("BullMQ Redis connecting...");
});

connection.on("ready", () => {
  console.log("BullMQ Redis connected successfully");
});

connection.on("error", (error) => {
  console.error("BullMQ Redis error:", error.message);
});

export default connection;
