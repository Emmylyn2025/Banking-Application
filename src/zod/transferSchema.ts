import { z } from "zod";

const transferSchema = z.object({
  acctNumber: z.number().min(1, "Account number is required").max(999999999, "Account number must be max of 9 digits"),
  amount: z.number().min(1, "The amount is required").positive("The amount must be a positive number"),
  password: z.string().min(1, "Password is required for transfer").min(6, "Password must be at least 6 characters long").trim()
});

export default transferSchema;