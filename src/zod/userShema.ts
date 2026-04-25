import { z } from "zod";

// Registration schema
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").min(3, "Name must be at least 3 characters long").trim(),
  email: z.string().min(1, "Email is required").email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters long").trim()
});

const LoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters long").trim()
});

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format").toLowerCase().trim()
});

const resetPasswordSchema = z.object({
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters long").trim()
});

export { registerSchema, LoginSchema, forgotPasswordSchema, resetPasswordSchema };
