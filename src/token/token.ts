import dotenv from "dotenv"
dotenv.config();
import jwt from "jsonwebtoken";
import { userToken } from "../types/types";
import { tokens } from "../types/types";
import { Response } from "express";
import crypto from "crypto";


function generateTokens(user: userToken): tokens {
  
  const accessSecret = process.env.accessTokenSecret;
  const refreshSecret = process.env.refreshTokenSecret;

  if (!accessSecret || !refreshSecret) {
    throw new Error(
      `JWT Secrets missing! Access: ${!!accessSecret}, Refresh: ${!!refreshSecret}`
    );
  }

  const accessToken = jwt.sign({
    id: user.id,
    role: user.role
  }, accessSecret, { expiresIn: "7m" });

  const refreshToken = jwt.sign({
    id: user.id,
    role: user.role
  }, refreshSecret, { expiresIn: "10d" });

  return { accessToken, refreshToken }
}

function saveRefreshCookie(res: Response, token: string) {
  
  res.cookie('refreshToken', token, {
    httpOnly: true,
    sameSite: "none",
    maxAge: 10 * 24 * 60 * 60 * 1000,
    secure: true
  });
}

function saveAccessCookie(res: Response, token: string) {
  
  res.cookie('accessToken', token, {
    httpOnly: true,
    sameSite: "none",
    maxAge:  7 * 60 * 1000,
    secure: true
  });
}

function clearAccess(res: Response) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: "none",
    maxAge:  7 * 60 * 1000,
    secure: true
  })
}

function clearRefresh(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: "none",
    maxAge:  10 * 24 * 60 * 60 * 1000,
    secure: true
  })
}

function verifyAccess(token: string) : userToken {
  return jwt.verify(token, process.env.accessTokenSecret!) as userToken;
}

function verifyRefresh(token: string) : userToken {
  return jwt.verify(token, process.env.refreshTokenSecret!) as userToken;
}

function hashPasswordResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function generatePasswordResetToken(): Promise<string> { 
  return await crypto.randomBytes(32).toString("hex");
}

export { saveAccessCookie, saveRefreshCookie, generateTokens, clearAccess, clearRefresh, verifyAccess, verifyRefresh, hashPasswordResetToken, generatePasswordResetToken };