import bcrypt from "bcrypt";

async function hashPassword (password: string) : Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function comparePassword(inputPassword: string, savedPassword: string) : Promise<boolean> {
  return await bcrypt.compare(inputPassword, savedPassword);
}

function removePassword(user: any) {
  const { password, ...rest } = user;
  return rest
}

export { hashPassword, comparePassword, removePassword };