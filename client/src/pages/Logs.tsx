import React, { useState, useEffect } from 'react';
import { Execution, Workflow } from '../types';
import api from '../services/api';
import { 
  CheckCircle2, XCircle, Loader2, Search, ArrowRight, Clock, 
  Terminal, RefreshCw, ChevronRight, AlertTriangle, Calendar 
} from 'lucide-react';

interface LogsProps {
  workflows: Workflow[];
  onNavigateToBuilder: (id: string) => void;
}

export const Logs: React.FC<LogsProps> = ({ workflows: initialWorkflows, onNavigateToBuilder }) => {
  const [logs, setLogs] = useState<Execution[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [selectedLog, setSelectedLog] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch workflows if not loaded
      if (workflows.length === 0) {
        const wfRes = await api.get('/workflows');
        setWorkflows(wfRes.data.workflows || []);
      }

      // Fetch logs
      const logRes = await api.get('/logs');
      const data = logRes.data.logs || [];
      setLogs(data);
      if (data.length > 0) {
        setSelectedLog(data[0]);
      }
    } catch (err) {
      console.error('Failed to load logs', err);
      // Fallback mocks
      const mockLogs: Execution[] = [
        {
          _id: 'mock_exe_1',
          workflowId: 'mock_wf_1',
          userId: 'user_1',
          status: 'success',
          triggerPayload: { email: 'client@domain.com', message: 'Hello' },
          stepResults: {
            'trigger-1': { status: 'success', duration: 15, input: {}, output: { message: 'Hello' } },
            'gemini-1': { 
              status: 'success', 
              duration: 320, 
              input: { prompt: 'Analyze sentiment: "Hello"' }, 
              output: { output: 'POSITIVE - The greeting indicates general politeness.' } 
            },
            'email-1': { 
              status: 'success', 
              duration: 45, 
              input: { to: 'client@domain.com', subject: 'Summary' }, 
              output: { status: 'sent', messageId: 'mock_mail_abc123' } 
            }
          },
          duration: 380,
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'mock_exe_2',
          workflowId: 'mock_wf_2',
          userId: 'user_1',
          status: 'failed',
          triggerPayload: { message: 'Bad support ticket' },
          stepResults: {
            'trigger-1': { status: 'success', duration: 10, input: {}, output: { message: 'Bad support ticket' } },
            'gemini-1': { 
              status: 'failed', 
              duration: 80, 
              input: { prompt: 'Summarize: "Bad support ticket"' }, 
              error: 'Gemini API Key missing or invalid.' 
            }
          },
          error: { message: 'Action step execution failed.', stepNodeId: 'gemini-1' },
          duration: 90,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ];
      setLogs(mockLogs);
      setSelectedLog(mockLogs[0]);
      
      if (workflows.length === 0) {
        setWorkflows([
          {
            _id: 'mock_wf_1',
            userId: 'user_1',
            name: 'Email Support Summarizer',
            description: 'Summarize ticket',
            isActive: true,
            nodes: [],
            edges: [],
            createdAt: '',
            updatedAt: '',
          },
          {
            _id: 'mock_wf_2',
            userId: 'user_1',
            name: 'Lead Enrichment Sync',
            description: 'Enrich lead',
            isActive: false,
            nodes: [],
            edges: [],
            createdAt: '',
            updatedAt: '',
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getWorkflowName = (workflowId: string) => {
    const wf = workflows.find((w) => w._id === workflowId);
    return wf ? wf.name : 'Unknown Workflow';
  };

  const getStatusBadge = (status: 'success' | 'failed' | 'running') => {
    switch (status) {
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'running':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Status filter
    if (filter === 'success' && log.status !== 'success') return false;
    if (filter === 'failed' && log.status !== 'failed') return false;

    // Search term filter (workflow name or error description)
    const wfName = getWorkflowName(log.workflowId).toLowerCase();
    const errorMsg = log.error?.message.toLowerCase() || '';
    const query = searchTerm.toLowerCase();

    return wfName.includes(query) || errorMsg.includes(query) || log._id.includes(query);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Execution Logs</h1>
          <p className="text-sm text-gray-400">View real-time and historic transaction summaries.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-gray-400 hover:text-white rounded-xl transition-all active:scale-95 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Logs
        </button>
      </div>

      {/* Main Split View */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left List Pane */}
        <div className="lg:col-span-1 glass-panel border border-neutral-800 rounded-2xl flex flex-col overflow-hidden h-full">
          {/* Controls / Filter Header */}
          <div className="p-4 border-b border-neutral-900 space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-900 text-xs font-semibold">
              {(['all', 'success', 'failed'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`flex-1 py-1.5 rounded-lg capitalize transition-all ${
                    filter === t
                      ? 'bg-neutral-900 text-white border border-neutral-800 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* List scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-900 p-2 space-y-1">
            {loading ? (
              <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs">Fetching execution logs...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-20 text-center text-gray-500 text-xs">
                No matching executions found.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log._id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                    selectedLog?._id === log._id
                      ? 'bg-neutral-900/60 border-neutral-800 shadow-lg shadow-black/20'
                      : 'bg-transparent border-transparent hover:bg-neutral-900/30'
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-2">
                    <span className="text-sm font-bold text-white truncate">
                      {getWorkflowName(log.workflowId)}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {getStatusBadge(log.status)}
                    <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {log.duration}ms
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-2 glass-panel border border-neutral-800 rounded-2xl flex flex-col overflow-hidden h-full">
          {selectedLog ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Detail Header */}
              <div className="p-6 border-b border-neutral-900 bg-neutral-950 shrink-0 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">
                      {getWorkflowName(selectedLog.workflowId)}
                    </h3>
                    {getStatusBadge(selectedLog.status)}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Run ID: {selectedLog._id} • {formatDate(selectedLog.createdAt)}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateToBuilder(selectedLog.workflowId)}
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-750 text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                >
                  Open Builder
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Detail Scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Duration / Stats banner */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider block mb-0.5">Total Duration</span>
                    <span className="text-lg font-extrabold text-white">{selectedLog.duration} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider block mb-0.5">Steps Executed</span>
                    <span className="text-lg font-extrabold text-white">
                      {Object.keys(selectedLog.stepResults || {}).length} Steps
                    </span>
                  </div>
                </div>

                {/* Overall Error banner */}
                {selectedLog.error && (
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Execution Exception Occurred</span>
                    </div>
                    <p className="pl-6">
                      Message: <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-red-300">{selectedLog.error.message}</code>
                    </p>
                    {selectedLog.error.stepNodeId && (
                      <p className="pl-6 text-[10px] text-gray-400">
                        Failed at Node Block: <code className="font-mono">{selectedLog.error.stepNodeId}</code>
                      </p>
                    )}
                  </div>
                )}

                {/* Trigger Payload */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3 border-b border-neutral-900 pb-1.5 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    Trigger Payload Input
                  </h4>
                  <pre className="bg-black p-3.5 rounded-xl border border-neutral-900 text-xs font-mono text-gray-400 overflow-x-auto">
                    {JSON.stringify(selectedLog.triggerPayload, null, 2)}
                  </pre>
                </div>

                {/* Step Trace Logs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest border-b border-neutral-900 pb-1.5 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Step Execution Details
                  </h4>
                  
                  <div className="space-y-3.5">
                    {Object.entries(selectedLog.stepResults || {}).map(([nodeId, step]: [string, any]) => (
                      <div
                        key={nodeId}
                        className={`p-4 rounded-xl border ${
                          step.status === 'success'
                            ? 'bg-emerald-950/10 border-emerald-500/10 text-emerald-300/90'
                            : 'bg-red-950/10 border-red-500/10 text-red-300/90'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {step.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="font-extrabold text-white text-xs">Block: {nodeId}</span>
                          </div>
                          {step.duration !== undefined && (
                            <span className="text-[10px] text-gray-500 font-semibold">{step.duration}ms</span>
                          )}
                        </div>

                        <div className="pl-6 space-y-2 mt-2 border-l border-neutral-800/40">
                          {step.input && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-0.5">Resolved Input:</span>
                              <pre className="bg-black/60 p-2.5 rounded text-[10px] text-gray-400 border border-neutral-900 overflow-x-auto">
                                {typeof step.input === 'object' ? JSON.stringify(step.input, null, 2) : step.input}
                              </pre>
                            </div>
                          )}

                          {step.output && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-indigo-400/60 block mb-0.5">Execution Output:</span>
                              <pre className="bg-black/60 p-2.5 rounded text-[10px] text-indigo-300 border border-indigo-950/20 overflow-x-auto">
                                {typeof step.output === 'object' ? JSON.stringify(step.output, null, 2) : step.output}
                              </pre>
                            </div>
                          )}

                          {step.error && (
                            <div className="text-red-400 text-[10px] mt-1">
                              Error: {step.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-6">
              <Terminal className="w-10 h-10 mb-2 text-neutral-700 animate-pulse" />
              <p className="text-sm">Select an execution from the list to view granular step-by-step logs.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
