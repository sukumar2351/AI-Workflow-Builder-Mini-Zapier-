import React from 'react';
import { Play, Loader2, CheckCircle2, XCircle, Terminal, AlertTriangle } from 'lucide-react';

interface ExecutionConsoleProps {
  onExecute: () => void;
  isRunning: boolean;
  logs: {
    nodeId: string;
    label: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    duration?: number;
    input?: any;
    output?: any;
    error?: string;
  }[];
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  onExecute,
  isRunning,
  logs,
}) => {
  return (
    <div className="w-full bg-[#0D0D11] border-t border-neutral-900 flex flex-col h-[280px]">
      {/* Console Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-900 bg-neutral-950">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-white">
            Execution Console
          </span>
        </div>
        <button
          onClick={onExecute}
          disabled={isRunning || logs.length === 0}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98]"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-white" />
              Test Run Flow
            </>
          )}
        </button>
      </div>

      {/* Console Output Logs */}
      <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-gray-400 space-y-3.5">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600">
            <Terminal className="w-8 h-8 mb-2" />
            <p className="max-w-xs">No active execution history. Click "Test Run Flow" to start step execution logs.</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border ${
                log.status === 'success'
                  ? 'bg-emerald-950/10 border-emerald-500/10 text-emerald-300/90'
                  : log.status === 'failed'
                  ? 'bg-red-950/10 border-red-500/10 text-red-300/90'
                  : log.status === 'running'
                  ? 'bg-indigo-950/10 border-indigo-500/10 text-indigo-300'
                  : 'bg-neutral-900/40 border-neutral-850 text-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {log.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {log.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                  {log.status === 'running' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                  {log.status === 'pending' && <Terminal className="w-4 h-4 text-neutral-600" />}
                  <span className="font-bold text-white text-[13px]">{log.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-500">
                    ID: {log.nodeId}
                  </span>
                </div>
                {log.duration !== undefined && (
                  <span className="text-[10px] text-gray-500 font-semibold">{log.duration}ms</span>
                )}
              </div>

              {/* Step inputs and outputs */}
              <div className="pl-6 space-y-2 mt-2 border-l border-neutral-800/50">
                {log.status === 'running' && <p className="text-[11px] animate-pulse">Processing step service action...</p>}
                
                {log.input && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-0.5">Resolved Input:</span>
                    <pre className="bg-neutral-950/80 p-2 rounded text-[10px] text-gray-400 border border-neutral-850 overflow-x-auto">
                      {typeof log.input === 'object' ? JSON.stringify(log.input, null, 2) : log.input}
                    </pre>
                  </div>
                )}

                {log.output && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-indigo-400/70 block mb-0.5">Execution Output:</span>
                    <pre className="bg-neutral-950/80 p-2 rounded text-[10px] text-indigo-300 border border-indigo-950/30 overflow-x-auto">
                      {typeof log.output === 'object' ? JSON.stringify(log.output, null, 2) : log.output}
                    </pre>
                  </div>
                )}

                {log.error && (
                  <div className="flex items-start gap-1.5 text-red-400 mt-2 text-[11px]">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Error: {log.error}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
