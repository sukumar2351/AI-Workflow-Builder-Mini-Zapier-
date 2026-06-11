import { Router } from 'express';
import { listTemplates } from '../controllers/templateController';

const router = Router();

router.get('/', listTemplates);

export default router;
