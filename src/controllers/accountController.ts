import { prisma } from "../lib/prisma";
import respond from "../utils/apiResponse";
import { appError, asyncHandler } from "../utils/error";
import { Request, Response, NextFunction } from "express";
import { userTranferTypes } from "../types/types";
import { comparePassword } from "../utils/password";
import QueryBuilder from "../utils/queryBuilder";
import { saveInRedis, getFromRedis } from "../Redis/utilityRedis";
import validateId from "../utils/validateId";


export const getAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  //Get account data from redis cache
  const cachedAccount = await getFromRedis(`account:${userId}`);

  if (cachedAccount) {
    const account = cachedAccount;
    const response = respond(true, "User account retrieved from cache", account);
    return res.status(200).json(response);
  }

  //Find user account
  const account = await prisma.account.findUnique({
    where: {
      userId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      debitHistory: true,
      creditHistory: true
    }
  });

  //If the account does not exists
  if (!account) return next(new appError("You don't have a bank account with us", 404));

  //Set account data in redis cache with exipiration time of 30minutes
  await saveInRedis(`account:${userId}`, account, 1800);

  //If the user account exists
  const response = respond(true, "User account retrieved", account);
  res.status(200).json(response);
});

export const transfer = asyncHandler(async (req: Request<{}, {}, userTranferTypes>, res: Response, next: NextFunction) => {
  const userId = req.user?.id
  const { acctNumber, amount, password } = req.body;
  
  //Get user account
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      password: true,
      account: {
        select: {
          id: true,
          Balance: true
        }
      }
    }
  });

  //Check if password is correct
  const isPasswordCorrect = await comparePassword(password, user?.password as string);

  if (!isPasswordCorrect) {
    const response = respond(false, "Invalid password", null);
    return res.status(401).json(response);
  }

  const balance = user?.account?.Balance

  //Check if the amount is less than 0 and if the amount is more than the balance account
  if (amount > 0 && amount > balance!) {
    const response = respond(false, "Insufficient funds", null);
    return res.status(400).json(response);
  }

  if (amount < 0) {
    const response = respond(false, "Cannot tranfer 0 to another account", null);
    return res.status(400).json(response);
  }

  //Make the transaction
  const updatedBalance = balance! - amount;

  //Get user account by account number
  const recieverAcct = await prisma.account.findUnique({
    where: {
      AcctNum: acctNumber
    }
  });

  if (!recieverAcct) {
    const response = respond(false, "The account is not found", null);
    return res.status(404).json(response);
  }

  const senderAcctId = user?.account?.id;

  const updateReciverAcct = recieverAcct?.Balance + amount

  const transferAcct = await prisma.$transaction(async (tx: any) => {
    //Update sender account
    await tx.account.update({
      where: {
        userId
      },
      data: {
        Balance: updatedBalance
      }
    })
    
    //Update receiver Account 
    await tx.account.update({
      where: {
        id: recieverAcct.id
      },
      data: {
        Balance: updateReciverAcct
      }
    })

    //Create new transaction
    const transaction = await tx.transacTions.create({
      data: {
        fromAccId: senderAcctId!,
        toAccId: recieverAcct.id!,
        userId: userId!,
        amount: amount
      }
    })

    return { transaction };
  })

  //After transaction is successful
  const data = transferAcct.transaction;
  const response = respond(true, "Money Transfer Successful", data);
  res.status(201).json(response);
});

export const allTransactions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  //Get transactions data from redis cache
  const cachedTransactions = await getFromRedis(`transactions:${userId}${JSON.stringify(req.query)}`);

  if (cachedTransactions) {
    const transactions = cachedTransactions;
    const response = respond(true, "Transactions retrieved from cache", transactions);
    return res.status(200).json(response);
  }

  const allowedFields = ["id", "fromAccId", "toAccId", "userId", "amount", "createdAt", "receiverAcct"];

  const builder = new QueryBuilder(req.query)
    .filter(allowedFields)
    .limitFields(allowedFields)
    .sort(allowedFields)
    .paginate()

  const transactions = await prisma.transacTions.findMany({
    where: {
      ...(builder.build().where || {}),
      userId
    },
    select: {
      ...(builder.build().select || {}),
      receiverAcct: {
        select: {
          id: true,
          userId: true,
          AcctNum: true,
          createdAt: true,
          user: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!transactions) {
    const response = respond(true, "You have no transactions", null);
    res.status(404).json(response);
  }

  //Set transactions data in redis cache with exipiration time of 30minutes
  await saveInRedis(`transactions:${userId}${JSON.stringify(req.query)}`, transactions, 1800);

  const response = respond(true, "Data retrieved successfully", transactions);
  res.status(200).json(response);

});

export const getTransactionById = asyncHandler(async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const transactionId = req.params.id;

  //Validate transactionId
  const result = validateId(transactionId);
  if (!result?.success) {
    return res.status(400).json(result);
  }

  //Get transaction data from redis cache
  const cachedTransaction = await getFromRedis(`transaction:${transactionId}`);

  if (cachedTransaction) {
    const transaction = cachedTransaction;
    const response = respond(true, "Transaction retrieved from cache", transaction);
    return res.status(200).json(response);
  }

  //Get the transaction
  const transaction = await prisma.transacTions.findUnique({
    where: {
      id: transactionId
    },
    include: {
      receiverAcct: {
        select: {
          id: true,
          userId: true,
          AcctNum: true,
          createdAt: true,
          user: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  if (!transaction) {
    const response = respond(false, "Transaction not found", null);
    res.status(404).json(response);
  }

  //Set transactions data in redis cache with exipiration time of 30minutes
  await saveInRedis(`transaction:${transactionId}`, transaction, 1800);

  const response = respond(true, "Transaction retrieved successfully", transaction);
  res.status(200).json(response);
});