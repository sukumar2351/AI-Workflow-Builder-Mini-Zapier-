import React from 'react';
import { Execution, Workflow } from '../../types';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

interface RecentActivityProps {
  executions: Execution[];
  workflows: Workflow[];
  onViewLogs: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  executions,
  workflows,
  onViewLogs,
}) => {
  const getWorkflowName = (workflowId: string) => {
    const wf = workflows.find((w) => w._id === workflowId);
    return wf ? wf.name : 'Unknown Workflow';
  };

  const getStatusBadge = (status: 'success' | 'failed' | 'running') => {
    switch (status) {
      case 'success':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Running
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString();
  };

  return (
    <div className="glass-panel border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <p className="text-xs text-gray-400">Live operational status logs</p>
        </div>
        <button
          onClick={onViewLogs}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
        >
          View all logs
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
        {executions.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            No workflows executed yet. Start building and trigger a flow!
          </div>
        ) : (
          executions.map((exe) => (
            <div
              key={exe._id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white">
                  {getWorkflowName(exe.workflowId)}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(exe.createdAt)} • {exe.duration}ms
                </span>
              </div>
              <div className="flex items-center gap-3">
                {exe.error && (
                  <span className="hidden md:inline text-xs text-red-400/80 max-w-[150px] truncate">
                    {exe.error.message}
                  </span>
                )}
                {getStatusBadge(exe.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
