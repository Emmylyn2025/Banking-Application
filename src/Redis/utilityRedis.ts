import redis from "./redis";

async function saveInRedis(key: string, value: any, expirationTime: number) : Promise<void> {
  await redis.setex(key, expirationTime, JSON.stringify(value));
}

async function getFromRedis(key: string): Promise<any> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export { saveInRedis, getFromRedis };