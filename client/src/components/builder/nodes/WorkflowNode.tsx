import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Clock, Globe, Sparkles, Mail, Link, Database, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const WorkflowNode: React.FC<NodeProps> = ({ id, data, selected, type }) => {
  const isTrigger = type?.toLowerCase().includes('trigger');

  const getIcon = () => {
    switch (type) {
      case 'manualTrigger':
        return <Play className="w-4 h-4 text-emerald-400" />;
      case 'scheduleTrigger':
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case 'webhookTrigger':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'geminiNode':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'emailNode':
        return <Mail className="w-4 h-4 text-pink-400" />;
      case 'httpNode':
        return <Link className="w-4 h-4 text-sky-400" />;
      case 'dbNode':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'sheetsNode':
        return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getHeaderStyle = () => {
    if (isTrigger) {
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300';
    }
    switch (type) {
      case 'geminiNode':
        return 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300';
      case 'emailNode':
        return 'border-pink-500/30 bg-pink-500/5 text-pink-300';
      case 'httpNode':
        return 'border-sky-500/30 bg-sky-500/5 text-sky-300';
      case 'dbNode':
        return 'border-purple-500/30 bg-purple-500/5 text-purple-300';
      case 'sheetsNode':
        return 'border-green-500/30 bg-green-500/5 text-green-300';
      default:
        return 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300';
    }
  };

  const getStatusIndicator = () => {
    if (!data.status) return null;
    if (data.status === 'success') {
      return (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border border-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (data.status === 'failed') {
      return (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-lg border border-red-400">
          <XCircle className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (data.status === 'running') {
      return (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-0.5 shadow-lg border border-amber-400 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 animate-spin" />
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`w-[220px] rounded-xl glass-panel shadow-2xl transition-all duration-200 border ${
        selected
          ? 'border-indigo-500 shadow-indigo-500/10 ring-1 ring-indigo-500'
          : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Node Status Indicator overlay */}
      {getStatusIndicator()}

      {/* Node Header */}
      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl border-b text-xs font-bold uppercase tracking-wider ${getHeaderStyle()}`}>
        {getIcon()}
        <span className="truncate">{data.label}</span>
      </div>

      {/* Node Body */}
      <div className="p-3.5">
        <p className="text-[10px] text-gray-400 leading-normal line-clamp-2">
          {data.description || 'Configurable node step.'}
        </p>
        
        {/* Render a quick summary of node config if present */}
        {type === 'geminiNode' && data.config?.task && (
          <div className="mt-2.5 text-[9px] bg-neutral-900 border border-neutral-850 px-2 py-1 rounded text-indigo-300 truncate">
            Task: {data.config.task}
          </div>
        )}
        {type === 'emailNode' && data.config?.to && (
          <div className="mt-2.5 text-[9px] bg-neutral-900 border border-neutral-850 px-2 py-1 rounded text-pink-300 truncate">
            Send to: {data.config.to}
          </div>
        )}
        {type === 'httpNode' && data.config?.url && (
          <div className="mt-2.5 text-[9px] bg-neutral-900 border border-neutral-850 px-2 py-1 rounded text-sky-300 truncate">
            {data.config.method || 'GET'} {data.config.url}
          </div>
        )}
      </div>

      {/* Input Handle (left) - Triggers don't need input */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          id="target-in"
          style={{ top: '50%' }}
        />
      )}

      {/* Output Handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-out"
        style={{ top: '50%' }}
      />
    </div>
  );
};
export default WorkflowNode;
