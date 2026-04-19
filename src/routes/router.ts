import express from "express";
import { registerUser, loginUser, refresh, logout, allUsers, updateUser, deleteUser } from "../controllers/userController";
import { auth, adminAuth } from "../middleware/authMiddleware";


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/users', auth, allUsers);
router.patch('/users/:userId', auth, adminAuth, updateUser);
router.delete('/users/:userId', auth, adminAuth, deleteUser);

export default router;