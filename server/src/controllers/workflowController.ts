import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Workflow } from '../models/Workflow';

export const listWorkflows = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const workflows = await Workflow.find({ userId }).sort({ updatedAt: -1 });
    return res.status(200).json({ workflows });
  } catch (error: any) {
    console.error('List workflows error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const createWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const { name, description, nodes, edges } = req.body;

    const newWorkflow = new Workflow({
      userId,
      name: name || 'My New Automation',
      description: description || '',
      isActive: false,
      nodes: nodes || [],
      edges: edges || [],
    });

    await newWorkflow.save();
    return res.status(201).json({ workflow: newWorkflow });
  } catch (error: any) {
    console.error('Create workflow error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const getWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const workflow = await Workflow.findOne({ _id: id, userId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found.' });
    }

    return res.status(200).json({ workflow });
  } catch (error: any) {
    console.error('Get workflow error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const updateWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const { name, description, isActive, nodes, edges } = req.body;

    const workflow = await Workflow.findOne({ _id: id, userId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found.' });
    }

    if (name !== undefined) workflow.name = name;
    if (description !== undefined) workflow.description = description;
    if (isActive !== undefined) workflow.isActive = isActive;
    if (nodes !== undefined) workflow.nodes = nodes;
    if (edges !== undefined) workflow.edges = edges;

    await workflow.save();
    return res.status(200).json({ message: 'Workflow updated successfully.', workflow });
  } catch (error: any) {
    console.error('Update workflow error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const deleteWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const result = await Workflow.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Workflow not found.' });
    }

    return res.status(200).json({ message: 'Workflow deleted successfully.' });
  } catch (error: any) {
    console.error('Delete workflow error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
