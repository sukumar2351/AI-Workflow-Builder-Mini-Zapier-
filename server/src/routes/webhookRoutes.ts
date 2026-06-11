import { Router } from 'express';

const router = Router();

// Public webhook receiver - no auth required, triggers by ID
router.post('/:webhookId', (_req, res) => {
  return res.json({ message: 'Webhook received. Execution scheduled.' });
});

export default router;
