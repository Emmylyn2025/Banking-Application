import redis from "../Redis/redis";
import { Queue } from "bullmq";


const emailQueue = new Queue("email", {
  connection: redis
})

export default emailQueue;