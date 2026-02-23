import { Router, type IRouter } from 'express';
import { connectHandler, statusHandler, disconnectHandler } from '../controllers/auth.controller';

const router: IRouter = Router();

router.get('/status', statusHandler);
router.post('/connect', connectHandler);
router.post('/disconnect', disconnectHandler);

export { router as authRouter };
