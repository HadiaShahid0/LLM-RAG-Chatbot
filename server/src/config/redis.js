import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (error) => {
  console.error("Redis Error:", error);
});

await redis.connect();

console.log("Redis Connected");

export default redis;