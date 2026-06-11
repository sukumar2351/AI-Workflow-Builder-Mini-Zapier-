import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Execution } from '../models/Execution';

export const listAllLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    // Retrieve all executions for this user, sorted by start time
    const logs = await Execution.find({ userId }).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ logs });
  } catch (error: any) {
    console.error('List logs error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
