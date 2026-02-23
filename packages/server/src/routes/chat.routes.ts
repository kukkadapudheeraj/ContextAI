import { Router, type IRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.middleware';
import { chatHandler } from '../controllers/chat.controller';

const router: IRouter = Router();

// 20 requests per minute per IP — prevents abuse without blocking normal use
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

// POST /api/chat — rate-limit → validate auth token → route to AI provider
router.post('/', chatLimiter, authMiddleware, chatHandler);

export { router as chatRouter };
