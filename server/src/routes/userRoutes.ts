import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protect all routes in this router
router.use(authMiddleware as any);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
