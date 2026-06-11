import { Schema, model, Document } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description: string;
  category: string;
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
  icon: string;
  createdAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    nodes: { type: Schema.Types.Mixed, default: [] },
    edges: { type: Schema.Types.Mixed, default: [] },
    icon: { type: String, default: 'text' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Template = model<ITemplate>('Template', TemplateSchema);
