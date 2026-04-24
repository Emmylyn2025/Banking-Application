import { rateLimit } from "express-rate-limit";
import { RedisStore, SendCommandFn } from "rate-limit-redis";
import redis from "../Redis/redis";

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 5 minutes)
  message: "Too many requests from this IP, please try again after 5 minutes",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (async (...args: string[]) => {
      const [command, ...rest] = args;
      return await redis.call(command, ...rest);
    }) as SendCommandFn
  })
});

export default limiter;