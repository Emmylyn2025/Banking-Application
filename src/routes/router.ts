import express from "express";
import { registerUser, loginUser, refresh, logout, allUsers, updateUser, deleteUser } from "../controllers/userController";
import { getAccount, transfer, allTransactions } from "../controllers/accountController";
import { auth, adminAuth } from "../middleware/authMiddleware";


const router = express.Router();

//User routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/users', auth, adminAuth, allUsers);
router.patch('/users/:userId', auth, adminAuth, updateUser);
router.delete('/users/:userId', auth, adminAuth, deleteUser);

//Account routes
router.get('/account', auth, getAccount);
router.post('/transfer', auth, transfer);
router.get('/transfer', auth,  allTransactions)

export default router;