import express from "express";
import { registerUser, loginUser, refresh, logout, allUsers, updateUser, deleteUser, forgotPassword, myAccount, resetPassword } from "../controllers/userController";
import { getAccount, transfer, allTransactions, getTransactionById } from "../controllers/accountController";
import { auth, adminAuth } from "../middleware/authMiddleware";
import validateRequest from "../zod/validationMiddleware";
import { registerSchema, LoginSchema, forgotPasswordSchema, resetPasswordSchema } from "../zod/userShema";
import transferSchema from "../zod/transferSchema";


const router = express.Router();

//User routes
router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(LoginSchema), loginUser);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/users', auth, adminAuth, allUsers);
router.get("/my-account", auth, myAccount);
router.patch('/users/:userId', auth, adminAuth, updateUser);
router.delete('/users/:userId', auth, adminAuth, deleteUser);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), resetPassword);


//Account routes
router.get('/account', auth, getAccount);
router.post('/transfer', auth, validateRequest(transferSchema), transfer);
router.get('/transfer', auth, allTransactions);
router.get('/transfer/:id', auth, getTransactionById);

export default router;