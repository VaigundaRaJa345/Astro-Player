import express from 'express';
import { register, login, getProfile, updateSettings } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.put('/settings', authenticateToken, updateSettings);

export default router;
