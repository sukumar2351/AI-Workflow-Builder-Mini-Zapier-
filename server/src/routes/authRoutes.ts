import { Router } from 'express';
import { register, login, googleRedirect, googleCallback, refresh, logout } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
