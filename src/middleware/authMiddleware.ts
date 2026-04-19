
import { Request, Response, NextFunction } from "express";
import respond from "../utils/apiResponse";
import { verifyAccess } from "../token/token";

export const auth = async (req: Request, res: Response, next: NextFunction) => {

  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.cookies?.accessToken) {

    token = req.cookies?.accessToken

  } else if (!token) {

    const response = respond(false, "Not authenticated", null);
    return res.status(401).json(response);

  }

  try {

    //Decode accesstoken
    const decoded = verifyAccess(token as string);
    req.user = decoded;

    next();
    
  } catch (error: any) {
    console.log(error.name === "TokenExpiredError");
  }
}

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const response = respond(false, "Not authenticated", null);
  if(req.user?.role !== "admin") return res.status(401).json(response);
}