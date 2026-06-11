import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { listAllLogs } from '../controllers/logController';

const router = Router();

router.use(authMiddleware as any);

router.get('/', listAllLogs as any);

export default router;
