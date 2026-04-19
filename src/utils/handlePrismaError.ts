import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import respond from "./apiResponse";
import { Response } from "express";

export function handlePrismaError(res: Response, error: unknown) {

  if (error instanceof PrismaClientKnownRequestError) {

    if (error.code === "P2025") {
      return {
        status: 404,
        message: "Record not found"
      }
    }

  }

  if (error instanceof PrismaClientInitializationError) {
    return {
      status: 404,
      message: "Invalid request"
    }
  }

  
  return {
    status: 500,
    message: "Something went wrong please try again later"
  }
} 