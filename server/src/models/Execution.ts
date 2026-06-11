import { Schema, model, Document } from 'mongoose';

export interface IExecution extends Document {
  workflowId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  status: 'success' | 'failed' | 'running';
  triggerPayload: Record<string, any>;
  stepResults: Record<string, {
    status: 'success' | 'failed' | 'skipped';
    duration?: number;
    input?: any;
    output?: any;
    error?: string;
  }>;
  error?: {
    message: string;
    stepNodeId?: string;
    stack?: string;
  };
  duration: number;
  createdAt: Date;
}

const ExecutionSchema = new Schema<IExecution>(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'running'],
      default: 'running',
    },
    triggerPayload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    stepResults: {
      type: Schema.Types.Mixed,
      default: {},
    },
    error: {
      message: { type: String },
      stepNodeId: { type: String },
      stack: { type: String },
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only log when it was run
  }
);

export const Execution = model<IExecution>('Execution', ExecutionSchema);
