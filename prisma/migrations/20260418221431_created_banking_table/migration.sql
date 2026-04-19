-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "AcctNum" INTEGER NOT NULL,
    "Balance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransacTions" (
    "id" UUID NOT NULL,
    "fromAccId" UUID NOT NULL,
    "toAccId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "TransacTions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_AcctNum_key" ON "Account"("AcctNum");

-- CreateIndex
CREATE UNIQUE INDEX "TransacTions_fromAccId_key" ON "TransacTions"("fromAccId");

-- CreateIndex
CREATE UNIQUE INDEX "TransacTions_toAccId_key" ON "TransacTions"("toAccId");

-- CreateIndex
CREATE UNIQUE INDEX "TransacTions_userId_key" ON "TransacTions"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacTions" ADD CONSTRAINT "TransacTions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacTions" ADD CONSTRAINT "TransacTions_fromAccId_fkey" FOREIGN KEY ("fromAccId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacTions" ADD CONSTRAINT "TransacTions_toAccId_fkey" FOREIGN KEY ("toAccId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
