import { bullMQConnection } from "../Redis/redis";
import { Worker } from "bullmq";
import { sendEmailForVerification, sendEmailForPasswordReset } from "../emails/sendEmail";


const emailWorker = new Worker("email", async (job) => {

  if (job.name === "sendVerificationEmail") {
    
    console.log("Processing job:", job.id, "with data:", job.data);
    const { email, url } = job.data;
  
    await sendEmailForVerification(email, url);

    console.log(`Email sent to ${email} for verification.`);

  }

  if (job.name === "sendPasswordResetEmail") {

    console.log("Processing job:", job.id, "with data:", job.data);
    const { email, url, ip, userAgent } = job.data;

    await sendEmailForPasswordReset(email, url, ip, userAgent);

    console.log(`Email sent to ${email} for password reset.`);
  }

}, {
  connection: bullMQConnection,
  concurrency: 5
});

emailWorker.on("completed", (job) => { console.log(`Job completed: ${job.id}`) });
emailWorker.on("failed", (job, err) => { console.error(`Job failed: ${job?.id}, Error: ${err.message}`) });

