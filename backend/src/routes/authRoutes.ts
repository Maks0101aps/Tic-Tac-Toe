import { Router, RequestHandler } from 'express';
import { register, login, getMe } from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register as RequestHandler);
router.post('/login', login as RequestHandler);

// Protected routes
router.get('/me', authMiddleware as RequestHandler, getMe as RequestHandler);

export default router; 