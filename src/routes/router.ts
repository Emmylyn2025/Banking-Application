import express from "express";
import { registerUser, loginUser, refresh, logout, allUsers, updateUser, deleteUser, forgotPassword, myAccount, resetPassword, userById } from "../controllers/userController";
import { getAccount, transfer, allTransactions, getTransactionById } from "../controllers/accountController";
import { auth, adminAuth } from "../middleware/authMiddleware";
import validateRequest from "../zod/validationMiddleware";
import { registerSchema, LoginSchema, forgotPasswordSchema, resetPasswordSchema } from "../zod/userShema";
import transferSchema from "../zod/transferSchema";
import { limiterAuth, limiter } from "../rateLimit/limiter";


const router = express.Router();

//User routes
router.post('/register', limiterAuth, validateRequest(registerSchema), registerUser);
router.post('/login', limiterAuth, validateRequest(LoginSchema), loginUser);
router.post('/refresh', limiter, refresh);
router.post('/logout', logout);
router.get('/users', limiter, auth, adminAuth, allUsers);
router.get("/my-account", limiter, auth, myAccount);
router.patch('/users/:userId', limiter, auth, adminAuth, updateUser);
router.delete('/users/:userId', limiter, auth, adminAuth, deleteUser);
router.post('/forgot-password', limiterAuth, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', limiterAuth, validateRequest(resetPasswordSchema), resetPassword);
router.get('/users/:id', limiter, auth, adminAuth, userById);

//Account routes
router.get('/account', limiter, auth, getAccount);
router.post('/transfer', limiterAuth, auth, validateRequest(transferSchema), transfer);
router.get('/transfer', limiter, auth, allTransactions);
router.get('/transfer/:id', limiter, auth, getTransactionById);

export default router;