import { prisma } from "../lib/prisma";
import respond from "../utils/apiResponse";
import { appError, asyncHandler } from "../utils/error";
import { Request, Response, NextFunction } from "express";
import { userTranferTypes } from "../types/types";
import { comparePassword } from "../utils/password";
import QueryBuilder from "../utils/queryBuilder";


export const getAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

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

  const transferAcct = await prisma.$transaction(async (tx) => {
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
  // const userId = req.user?.id;

  // const allowedFields = ["name", "id", "email", "createdAt", "role"];

  //  const builder = new QueryBuilder(req.query)
  //     .filter(allowedFields)
  //     .limitFields(allowedFields)
  //     .sort(allowedFields)
  //     .paginate()

  // //Get all Transactions
  // const transactions = await prisma.transacTions.findMany();
})