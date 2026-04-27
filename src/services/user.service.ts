import { prisma } from "../lib/prisma";

async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: {
      email
    }
  });
}

async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: {
      id
    }
  });
}

export { getUserByEmail, getUserById };