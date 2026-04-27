import { Redis } from "ioredis";

const redis = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: 3
});

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