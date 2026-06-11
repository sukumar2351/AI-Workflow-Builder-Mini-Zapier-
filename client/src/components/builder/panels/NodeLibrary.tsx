import React from 'react';
import { Play, Clock, Globe, Sparkles, Mail, Link, Database, FileSpreadsheet } from 'lucide-react';
import { NodeType } from '../../../types';

interface NodeLibraryProps {
  onAddNode: (type: NodeType) => void;
}

export const NodeLibrary: React.FC<NodeLibraryProps> = ({ onAddNode }) => {
  const nodeDefinitions = [
    {
      section: 'Triggers',
      items: [
        {
          type: 'manualTrigger' as NodeType,
          label: 'Manual Trigger',
          description: 'Start execution manually with custom mock inputs',
          icon: Play,
          color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5',
        },
        {
          type: 'scheduleTrigger' as NodeType,
          label: 'Schedule Trigger',
          description: 'Run automation at set schedules (interval or cron)',
          icon: Clock,
          color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5',
        },
        {
          type: 'webhookTrigger' as NodeType,
          label: 'Webhook Trigger',
          description: 'Run flow automatically when a webhook URL is pinged',
          icon: Globe,
          color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5',
        },
      ],
    },
    {
      section: 'Actions',
      items: [
        {
          type: 'geminiNode' as NodeType,
          label: 'Gemini AI',
          description: 'Leverage Gemini models to summarize, translate, or enrich',
          icon: Sparkles,
          color: 'text-indigo-400 border-indigo-500/10 bg-indigo-500/5',
        },
        {
          type: 'emailNode' as NodeType,
          label: 'Send Email',
          description: 'Send alerts or summaries using transactional mail',
          icon: Mail,
          color: 'text-pink-400 border-pink-500/10 bg-pink-500/5',
        },
        {
          type: 'httpNode' as NodeType,
          label: 'HTTP Request',
          description: 'Ping webhook receivers or external web APIs',
          icon: Link,
          color: 'text-sky-400 border-sky-500/10 bg-sky-500/5',
        },
        {
          type: 'dbNode' as NodeType,
          label: 'Save to DB',
          description: 'Persist customized key-value states in MongoDB',
          icon: Database,
          color: 'text-purple-400 border-purple-500/10 bg-purple-500/5',
        },
        {
          type: 'sheetsNode' as NodeType,
          label: 'Google Sheets',
          description: 'Log flow outputs or lead rows into spreadsheets',
          icon: FileSpreadsheet,
          color: 'text-green-400 border-green-500/10 bg-green-500/5',
        },
      ],
    },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 border-r border-neutral-900 bg-neutral-950 p-5 flex flex-col gap-6 select-none h-full overflow-y-auto">
      <div>
        <h3 className="text-sm font-extrabold text-white tracking-wider uppercase mb-1">
          Node Library
        </h3>
        <p className="text-[10px] text-gray-500">
          Drag and drop blocks onto the canvas or click to add them instantly.
        </p>
      </div>

      <div className="space-y-6">
        {nodeDefinitions.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-neutral-900 pb-1.5">
              {section.section}
            </h4>
            <div className="space-y-2.5">
              {section.items.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                    onClick={() => onAddNode(node.type)}
                    className={`group flex items-start gap-3 p-3 rounded-xl border border-neutral-850 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]`}
                  >
                    <div className={`p-2 rounded-lg border ${node.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {node.label}
                      </span>
                      <span className="text-[10px] text-gray-500 leading-normal">
                        {node.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
