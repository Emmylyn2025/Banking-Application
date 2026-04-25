import { asyncHandler, appError } from "../utils/error";
import { Request, Response, NextFunction } from "express";
import { userBody, loginBody, userUpdateParams, userUpdateBody, userDeleteParams } from "../types/types";
import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { hashPassword, removePassword, comparePassword } from "../utils/password";
import removeSome from "../utils/removeUserFields";
import { generateTokens, saveAccessCookie, saveRefreshCookie, verifyRefresh, clearAccess, clearRefresh, hashPasswordResetToken } from "../token/token";
import respond from "../utils/apiResponse";
import QueryBuilder from "../utils/queryBuilder";
import { handlePrismaError } from "../utils/handlePrismaError";
import { saveInRedis, getFromRedis } from "../Redis/utilityRedis";
import { generatePasswordResetToken } from "../token/token";
import { sendEmailForPasswordReset, sendEmailForVerification } from "../emails/sendEmail";

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
        password: hashedPassword,
        emailVerified: false
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

  const verifyEmailToken = await generatePasswordResetToken();

  //Save the verify email token in redis with expiration time of 24hours
  await saveInRedis(`verifyEmail:${verifyEmailToken}`, result.newUser.id, 60 * 60 * 24);

  //Send email to user with the token and the url to verify email
  const verifyEmailUrl = `${process.env.base_url}/banking/verify-email/${verifyEmailToken}`; 

  //Send the link to the user email for email verification
  await sendEmailForVerification(result.newUser.email, verifyEmailUrl);

  const response = respond(true, "User created Successfully, Make sure to verify your email, to make your account active and secure", together);

  res.status(201).json(response);
});

export const verifyEmail = asyncHandler(async (req: Request<{ token: string }, {}, {}>, res: Response, next: NextFunction) => {
  const { token } = req.params;

  //Get the user id from redis using the token
  const userId = await getFromRedis(`verifyEmail:${token}`);

  if (!userId) {
    return next(new appError("Invalid or expired verification token", 400));
  }

  //Find the user and update emailVerified to true
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    return next(new appError("User not found", 404));
  }

  //If user is found, update emailVerified to true
  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      emailVerified: true
    }
  });

  //Delete the token from redis
  await saveInRedis(`verifyEmail:${token}`, "", 0);

  const response = respond(true, "Email verified successfully", null);
  res.status(200).json(response);
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

  //Check if the user has verified their email
  if(user.emailVerified === false) return next(new appError("Please verify your email to login", 401));

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
  await saveInRedis(`access(banking)${afterRemoval.id}`, accessToken, 420);
  await saveInRedis(`refresh(banking)${afterRemoval.id}`, refreshToken, 604800);

  const response = respond(true, "Login Successful", accessToken);

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
    await saveInRedis(`refresh(banking)${user.id}`, refreshToken, 604800);

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
    await saveInRedis(`refresh(banking)${user.id}`, "", 0);

    //Response 
    const response = respond(true, "Logout Successful", null);

    res.status(200).json(response);
    
  } catch (error: any) {
    console.log(error.message);
  }
});

export const myAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  //Get account data from redis cache
  const cachedAccount = await getFromRedis(`myaccount:${userId}`);

  if (cachedAccount) { 
    const account = cachedAccount;
    const response = respond(true, "User account retrieved from cache", account);
    return res.status(200).json(response);
  }

  //Get my account details from database
  const user = await prisma.user.findUnique({
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
          AcctNum: true,
          Balance: true,
          createdAt: true
        }
      }
    }
  })

  if (!user) {
    const response = respond(false, "User not found", null);
    return res.status(404).json(response);
  }

  //set account data in redis cache with expiration time of 30minutes
  await saveInRedis(`myaccount:${userId}`, user, 1800);

  const response = respond(true, "Account details retrieved", user);
  res.status(200).json(response);
});

export const forgotPassword = asyncHandler(async (req: Request<{}, {}, { email: string }>, res: Response, next: NextFunction) => {
  const { email } = req.body;
  //Check if the email exists
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) return next(new appError("User is not registered", 404));

  //If user exists, generate reset token and send email to user with the token
  const resetToken = await generatePasswordResetToken();

  //Save the hashed reset token in redis with expiration time of 10minutes
  await saveInRedis(`resetToken:${resetToken}`, user.id, 600);

  //Add the hashed reset token to the reset url
  const resetUrl = `${process.env.base_url}/banking/reset-password/${resetToken}`;
  //console.log(resetUrl);

  //Send the link to the user email for password reset
  const ip = req.ip!;
  const userAgent = req.headers["user-agent"] || "unknown";
  await sendEmailForPasswordReset(user.email, resetUrl, ip, userAgent)

  const response = respond(true, "Reset url has been sent to your email", null);
  res.status(200).json(response);
});

export const resetPassword = asyncHandler(async (req: Request<{ token: string }, {}, { password: string }>, res: Response, next: NextFunction) => { 
  const { token } = req.params;
  const { password } = req.body;

  //Get the hashed toke from redis
  const savedHasedToken = await getFromRedis(`resetToken:${token}`);

  //If the token is invalid or expired
  if (!savedHasedToken) {
    const response = respond(false, "Invalid or expired token", null);
    return res.status(400).json(response);
  }

  try {
    //If the token is valid, find the user and update the password
    await prisma.user.update({
      where: {
        id: savedHasedToken
      },
      data: {
        password: await hashPassword(password)
      }
    });

    const response = respond(true, "Password reset successful", null);
    res.status(200).json(response);

    //Delete the token from redis
    await saveInRedis(`resetToken:${token}`, "", 0);
    
  } catch (error: any) {
    const { status, message } = handlePrismaError(res, error);
    const response = respond(false, message, null);
    res.status(status).json(response);
  }
})

export const allUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

  const allowedFields = ["name", "id", "email", "createdAt", "role"];

  const cachedUsers = await getFromRedis(`allusers:${JSON.stringify(req.query)}`);

  if(cachedUsers) {
    const response = respond(true, "Users retrieved from cache", cachedUsers);
    return res.status(200).json(response);
  }

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

  if (!allUsers || allUsers.length === 0) {
    const response = respond(true, "No users found", null);
    return res.status(200).json(response);
  }

  //If there are users, set the data in redis cache with expiration time of 30minutes
  await saveInRedis(`allusers:${JSON.stringify(req.query)}`, allUsers, 1800);

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
    const response = respond(false, message, null);
    res.status(status).json(response);
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
    const response = respond(false, message, null);
    res.status(status).json(response);
  }
});