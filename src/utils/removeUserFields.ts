import { userRemoval } from "../types/types";

function removeSome(user: userRemoval) {
  const { password, email, createdAt, name, ...rest } = user;
  return rest;
} 

export default removeSome;