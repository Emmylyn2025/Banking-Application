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

//Seperate connection for BullMq
export const bullMQConnection = {
  host: new URL(process.env.REDIS_URL!).hostname,
  port: Number(new URL(process.env.REDIS_URL!).port),
  password: new URL(process.env.REDIS_URL!).password || undefined,
};

export default redis;