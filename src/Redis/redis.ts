import { Redis } from "ioredis";
import dotenv from "dotenv";

const redis = new Redis(process.env.REDIS_URL!);

redis.on("connect", () => {
  console.log("Connected to redis");
});

redis.on("error", (err: Error) => {
  console.error("Redis error:", err);
});

// Event: Reconnecting
redis.on("reconnecting", (time: number) => {
  console.warn(`Redis: Reconnecting in ${time}ms...`);
});

export default redis;