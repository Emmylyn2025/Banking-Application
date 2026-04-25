import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";

const resend = new Resend(process.env.resend_api_key!);

//console.log(process.env.resend_from!);

async function sendEmailForVerification(to: string, verificationToken: string) {

  const html = fs.readFileSync("src/emails/verifyEmail.html", "utf-8");
  const customizedHtml = html.replace(/{{verification_link}}/g, verificationToken);

  try {

    const { error, data } = await resend.emails.send({
      from: process.env.resend_from!,
      to,
      subject: "verify your email",
      html: customizedHtml
    });

    if (error) {
      console.log("Error sending verification email:", error);
    } else {
      console.log("Verification email sent successfully:", data);
    }

  } catch (error) {
    console.error("Error sending emailverification email:", error);
    throw new Error("Failed to send verification email");
  }
}

async function sendEmailForPasswordReset(to: string, resetToken: string, ip: string, userAgent: string) {
  const html = fs.readFileSync("src/emails/forgotPasswordEmail.html", "utf-8");
  const customizedHtml = html.replace(/{{reset_link}}/g, resetToken);
  const customizedHtmlWithDetails = customizedHtml.replace(/{{ip_address}}/g, ip).replace(/{{user_agent}}/g, userAgent);

  try {

    const {error, data} = await resend.emails.send({
      from: process.env.resend_from!,
      to,
      subject: "Reset your password",
      html: customizedHtmlWithDetails
    })

    if (error) {
      console.log("Error sending password reset email:", error);
    } else {
      console.log("Password reset email sent successfully:", data);
    }

  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export { sendEmailForVerification, sendEmailForPasswordReset };
