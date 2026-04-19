import { asyncHandler, appError } from "../utils/error";
import { Request, Response, NextFunction } from "express";
import { userBody, loginBody, userUpdateParams, userUpdateBody, userDeleteParams } from "../types/types";
import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { hashPassword, removePassword, comparePassword } from "../utils/password";
import removeSome from "../utils/removeUserFields";
import { generateTokens, saveAccessCookie, saveRefreshCookie, verifyRefresh, clearAccess, clearRefresh } from "../token/token";
import redis from "../Redis/redis";
import respond from "../utils/apiResponse";
import QueryBuilder from "../utils/queryBuilder";
import { handlePrismaError } from "../utils/handlePrismaError";

export const registerUser = asyncHandler(async (req: Request<{}, {}, userBody>, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  
  //Check if the user Exists before
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (user) return next(new appError("This is a registered user", 400));

  //Generate 9 digit account number
  const acctNum = await crypto.randomInt(100000000, 1000000000);

  //Hashpassword before saving
  const hashedPassword = await hashPassword(password)

  //Create user and create user account with transactions
  const result = await prisma.$transaction(async (tx) => {
    //Create a new user
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    //Create account for the user
    const acct = await tx.account.create({
      data: {
        userId: newUser.id,
        Balance: 0,
        AcctNum: acctNum
      }
    });

    return { newUser, acct };
  });

  //Remove user password from result
  const final = removePassword(result.newUser);
  const userAccount = result.acct;
  const together = { ...final, ...userAccount };

  const response = respond(true, "User created Successfully", together);

  res.status(201).json(response);
});

export const loginUser = asyncHandler(async (req: Request<{}, {}, loginBody>, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  //Check if the email exists
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) return next(new appError("User not registered", 401));

  //Compare password
  const pass = await comparePassword(password, user.password);

  //If password is false
  if (!pass) return next(new appError("Invalid password", 401));

  //Remove some fields from the user to generate tokens
  const afterRemoval = removeSome(user);

  //Generate tokens
  const { accessToken, refreshToken } = generateTokens(afterRemoval);
  
  //Save access and refresh token in cookie
  saveAccessCookie(res, accessToken);
  saveRefreshCookie(res, refreshToken);

  //Save accessToken in redis
  await redis.set(`access(banking)${afterRemoval.id}`, accessToken, 'EX', 420);

  //Save refresh token in redis for back up
  await redis.set(`refresh(banking)${afterRemoval.id}`, refreshToken, 'EX', 604800);

  const response = respond(true, "Login Successful", accessToken)

  res.status(200).json(response);
});

export const refresh = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) return next(new appError("No refresh token available", 400));

  try {
    //verify Refresh token
    const user = verifyRefresh(oldRefreshToken);

    //Generate new access and refresh token
    const { accessToken, refreshToken } = generateTokens(user);
    
    //Save access and refresh token in cookies
    saveAccessCookie(res, accessToken);
    saveRefreshCookie(res, refreshToken);

    //Save inside of redis
    await redis.set(`access(banking)${user.id}`, accessToken, 'EX', 420);
    await redis.set(`refresh(banking)${user.id}`, refreshToken, 'EX', 604800);

    const response = respond(true, "Refresh successful", accessToken);

    res.status(200).json(response);
    
  } catch (error: any) {
    console.log(error.message);
  }
});

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) return next(new appError("No refresh token available", 400));

  try {
    //Verify refresh token
    const user = verifyRefresh(oldRefreshToken);

    //Clear cookies
    clearAccess(res);
    clearRefresh(res);

    //Delete tokens from redis
    await redis.del(`access(banking)${user.id}`);
    await redis.del(`refresh(banking)${user.id}`);

    //Response 
    const response = respond(true, "Logout Successful", null);

    res.status(200).json(response);
    
  } catch (error: any) {
    console.log(error.message);
  }
});

export const allUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

  const allowedFields = ["name", "id", "email", "createdAt", "role"];

  const builder = new QueryBuilder(req.query)
    .filter(allowedFields)
    .limitFields(allowedFields)
    .sort(allowedFields)
    .paginate()

  const allUsers = await prisma.user.findMany({
    ...builder.build(),
    select: {
      ...(builder.build().select || {}),
      account: {
        select: {
          id: true,
          AcctNum: true,
          Balance: true,
          createdAt: true
        }
      }
    }
  });

  const formatMessage = allUsers.length > 1 ? "Users retrieved Successfully" : "User retrieved"

  const response = respond(true, `${formatMessage}`, allUsers);

  res.status(200).json(response);
});

export const updateUser = asyncHandler(async (req: Request<userUpdateParams, {}, userUpdateBody>, res: Response, next: NextFunction) => {
  const userId = req.params.userId;
  const { role, Balance, accountId } = req.body;
  
  try {

    //Find user and update
    const user = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        role,
        account: {
          update: {
            where: {
              id: accountId
            },
            data: {
              Balance
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        account: {
          select: {
            id: true,
            Balance: true
          }
        }
      }
    });

    const response = respond(true, "User updated successfully", user);

    res.status(200).json(response);
    
  } catch (error: any) {
    const { status, message } = handlePrismaError(res, error)
    res.status(status).json(message);
  }
});

export const deleteUser = asyncHandler(async (req: Request<userDeleteParams, {}, userUpdateBody>, res: Response, next: NextFunction) => {
  const userId = req.params.userId;

  try {

    const user = await prisma.user.delete({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        account: {
          select: {
            id: true,
            Balance: true,
            createdAt: true
          }
        }
      }
    });

    const response = respond(true, "User deleted Successfully", user);
    res.status(200).json(response);
    
  } catch (error: any) {
    const { status, message } = handlePrismaError(res, error)
    res.status(status).json(message);
  }
})