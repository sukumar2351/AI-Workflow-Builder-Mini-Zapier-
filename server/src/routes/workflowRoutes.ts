import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  listWorkflows,
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from '../controllers/workflowController';
import {
  runWorkflow,
  getWorkflowExecutions,
} from '../controllers/executionController';

const router = Router();

// Secure all routes
router.use(authMiddleware as any);

router.get('/', listWorkflows);
router.post('/', createWorkflow);
router.get('/:id', getWorkflow);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);

// Execution Engine endpoints
router.post('/:id/execute', runWorkflow as any);
router.get('/:id/executions', getWorkflowExecutions as any);

export default router;
