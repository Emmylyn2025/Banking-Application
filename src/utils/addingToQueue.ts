import emailQueue from "../Queues/emailQueue";

async function addEmailToQueue<T>(queueName: string, data: T) {
  try {

    await emailQueue.add(queueName, data, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      }
    })
    
  } catch (error: any) {
    console.error("Error adding email to queue:", error.message);
  }
}

export { addEmailToQueue };