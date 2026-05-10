import { bullMQConnection } from "../Redis/redis";
import { Queue } from "bullmq";


const emailQueue = new Queue("email", {
  connection: bullMQConnection
})

export default emailQueue;