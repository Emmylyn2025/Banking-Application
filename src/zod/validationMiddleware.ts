import { ZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import respond from "../utils/apiResponse";

const validateRequest = (schema: ZodObject<any>) => { 
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        
        const errors = error.issues.map((err: any) => ({ message: err.message }));
        const response = respond(false, "Validation failed", { errors });
        return res.status(400).json(response);
      }
    }
  }
}

export default validateRequest;