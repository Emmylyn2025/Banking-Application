import { userRemoval } from "../types/types";

function removeSome(user: userRemoval) {
  const { password, emailVerified, email, createdAt, name, ...rest } = user;
  return rest;
} 

export default removeSome;