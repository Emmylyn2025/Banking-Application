import express from "express";
import { registerUser, loginUser, refresh, logout, allUsers, updateUser, deleteUser, forgotPassword, myAccount } from "../controllers/userController";
import { getAccount, transfer, allTransactions, getTransactionById } from "../controllers/accountController";
import { auth, adminAuth } from "../middleware/authMiddleware";


const router = express.Router();

//User routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/users', auth, adminAuth, allUsers);
router.get("/my-account", auth, myAccount);
router.patch('/users/:userId', auth, adminAuth, updateUser);
router.delete('/users/:userId', auth, adminAuth, deleteUser);
router.post('/forgot-password', forgotPassword);


//Account routes
router.get('/account', auth, getAccount);
router.post('/transfer', auth, transfer);
router.get('/transfer', auth, allTransactions);
router.get('/transfer/:id', auth, getTransactionById);

export default router;