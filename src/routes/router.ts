import express from "express";
import { registerUser, loginUser, refresh, logout, allUsers } from "../controllers/userController";
import { auth } from "../middleware/authMiddleware";


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/users', auth, allUsers)

export default router;