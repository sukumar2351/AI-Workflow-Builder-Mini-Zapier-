export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  apiKeys: {
    geminiApiKey?: string;
  };
}

export type NodeType = 
  | 'manualTrigger'
  | 'scheduleTrigger'
  | 'webhookTrigger'
  | 'geminiNode'
  | 'emailNode'
  | 'httpNode'
  | 'dbNode'
  | 'sheetsNode';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    description: string;
    config: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface Workflow {
  _id: string;
  userId: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger?: {
    type: string;
    parameters: Record<string, any>;
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface StepResult {
  status: 'success' | 'failed' | 'skipped';
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
}

export interface Execution {
  _id: string;
  workflowId: string;
  userId: string;
  status: 'success' | 'failed' | 'running';
  triggerPayload: Record<string, any>;
  stepResults: Record<string, StepResult>;
  error?: {
    message: string;
    stepNodeId?: string;
  };
  duration: number;
  createdAt: string;
}

export interface Template {
  _id?: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  icon: string;
}
