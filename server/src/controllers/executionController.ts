import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { executeWorkflow } from '../services/executor';
import { Execution } from '../models/Execution';

export const runWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { payload } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    console.log(`Triggering manual run for workflow ${id} by user ${userId}`);
    const results = await executeWorkflow(id, userId, payload || {});

    if (results.runStatus === 'failed') {
      return res.status(400).json({
        message: results.error?.message || 'Workflow execution failed.',
        runStatus: results.runStatus,
        stepResults: results.stepResults,
      });
    }

    return res.status(200).json(results);
  } catch (error: any) {
    console.error('Execution router error:', error);
    return res.status(500).json({ message: error.message || 'Execution error.' });
  }
};

export const getWorkflowExecutions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const executions = await Execution.find({ workflowId: id, userId }).sort({ createdAt: -1 });
    return res.status(200).json({ executions });
  } catch (error: any) {
    console.error('Get executions error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
