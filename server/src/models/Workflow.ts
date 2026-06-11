import { Schema, model, Document } from 'mongoose';

export interface IWorkflow extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  description: string;
  isActive: boolean;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      description?: string;
      config: Record<string, any>;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: 'Untitled Workflow',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    nodes: {
      type: [
        {
          id: { type: String, required: true },
          type: { type: String, required: true },
          position: {
            x: { type: Number, required: true },
            y: { type: Number, required: true },
          },
          data: {
            label: { type: String, required: true },
            description: { type: String },
            config: { type: Schema.Types.Mixed, default: {} },
          },
        },
      ],
      default: [],
    },
    edges: {
      type: [
        {
          id: { type: String, required: true },
          source: { type: String, required: true },
          target: { type: String, required: true },
          sourceHandle: { type: String, default: null },
          targetHandle: { type: String, default: null },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Workflow = model<IWorkflow>('Workflow', WorkflowSchema);
