import { Router } from 'express';
import {
  register, login, logout, me, updateProfile,
  changePassword, updateFavorites, forgotPassword, resetPassword,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);
router.patch('/change-password', requireAuth, changePassword);
router.patch('/favorites', requireAuth, updateFavorites);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
