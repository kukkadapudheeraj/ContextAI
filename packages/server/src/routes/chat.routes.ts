import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { chatHandler } from '../controllers/chat.controller';

const router: IRouter = Router();

// POST /api/chat — validate auth token, then route to AI provider
router.post('/', authMiddleware, chatHandler);

export { router as chatRouter };
