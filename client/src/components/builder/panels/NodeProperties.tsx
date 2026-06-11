import React, { useEffect, useState } from 'react';
import { WorkflowNode } from '../../../types';
import { Save, AlertTriangle, Copy, Check, Info } from 'lucide-react';

interface NodePropertiesProps {
  node: WorkflowNode | null;
  onUpdateNode: (nodeId: string, updatedData: Partial<WorkflowNode>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({
  node,
  onUpdateNode,
  onDeleteNode,
}) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      setDescription(node.data.description || '');
      setConfig(node.data.config || {});
    }
  }, [node]);

  if (!node) {
    return (
      <aside className="w-80 border-l border-neutral-900 bg-neutral-950 p-5 flex items-center justify-center text-center text-gray-500 h-full">
        <div>
          <Info className="w-8 h-8 mx-auto text-neutral-800 mb-3" />
          <p className="text-xs">Select a node on the canvas to configure its settings.</p>
        </div>
      </aside>
    );
  }

  const handleFieldChange = (key: string, value: any) => {
    const updatedConfig = { ...config, [key]: value };
    setConfig(updatedConfig);
    onUpdateNode(node.id, {
      data: {
        ...node.data,
        config: updatedConfig,
      },
    });
  };

  const handleMetadataChange = (field: 'label' | 'description', value: string) => {
    if (field === 'label') setLabel(value);
    if (field === 'description') setDescription(value);

    onUpdateNode(node.id, {
      [field === 'label' ? 'data' : 'description']: {
        ...node.data,
        [field]: value,
      },
    } as any);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderConfigFields = () => {
    switch (node.type) {
      case 'manualTrigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Mock Input Payload (JSON)
              </label>
              <textarea
                value={config.payload ? JSON.stringify(config.payload, null, 2) : '{\n  "email": "customer@example.com",\n  "message": "I love the new AI workflow tool!"\n}'}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleFieldChange('payload', parsed);
                  } catch (err) {
                    // Temporarily store raw text or skip updating if invalid JSON
                  }
                }}
                rows={5}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-500"
              />
              <p className="text-[9px] text-gray-500 mt-1">
                This JSON payload will represent the trigger data when you execute manually.
              </p>
            </div>
          </div>
        );

      case 'scheduleTrigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Schedule Type
              </label>
              <select
                value={config.scheduleType || 'interval'}
                onChange={(e) => handleFieldChange('scheduleType', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="interval">Interval (Minutes)</option>
                <option value="cron">Cron Expression</option>
              </select>
            </div>

            {config.scheduleType === 'cron' ? (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={config.cron || '*/5 * * * *'}
                  onChange={(e) => handleFieldChange('cron', e.target.value)}
                  placeholder="e.g. 0 * * * * (Every hour)"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="text-[9px] text-gray-500 mt-1">
                  Format: minute hour day-of-month month day-of-week
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Interval Minutes
                </label>
                <input
                  type="number"
                  value={config.interval || 15}
                  onChange={(e) => handleFieldChange('interval', parseInt(e.target.value))}
                  placeholder="e.g. 15"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        );

      case 'webhookTrigger':
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1';
        const mockWebhookUrl = `${apiBaseUrl}/webhooks/${node.id}`;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={mockWebhookUrl}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-[10px] font-mono text-gray-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(mockWebhookUrl)}
                  className="p-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-750 text-indigo-400 rounded-xl transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[9px] text-gray-500 mt-1.5">
                Ping this URL with a `POST` request. The body JSON elements will be parsed into {"{{trigger.*}}"}.
              </p>
            </div>
          </div>
        );

      case 'geminiNode':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Gemini Model
              </label>
              <select
                value={config.model || 'gemini-2.5-flash'}
                onChange={(e) => handleFieldChange('model', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                AI Operation Preset
              </label>
              <select
                value={config.task || ''}
                onChange={(e) => handleFieldChange('task', e.target.value || undefined)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="">Custom Prompt (No Preset)</option>
                <option value="summarize">Summarize text</option>
                <option value="generate">Generate content</option>
                <option value="translate">Translate text</option>
                <option value="sentiment">Sentiment analysis</option>
                <option value="keywords">Extract keywords</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                System Instructions
              </label>
              <textarea
                value={config.systemPrompt || ''}
                onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
                placeholder="Give the AI a persona, constraints, or format rules."
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                User Prompt / Input Text
              </label>
              <textarea
                value={config.prompt || ''}
                onChange={(e) => handleFieldChange('prompt', e.target.value)}
                placeholder="Write your prompt. Use {{trigger.field}} or {{nodes.node_id.output}} to map previous inputs."
                rows={5}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              />
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex items-start gap-2 text-[9px] text-indigo-300">
                <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span>Downstream mapping variables:</span>
                  <ul className="list-disc pl-3 space-y-0.5">
                    <li>Output text: <code className="bg-black/35 px-1.5 py-0.5 rounded text-[9px] text-indigo-400">{"{{nodes." + node.id + ".output}}"}</code></li>
                    <li>Tokens: <code className="bg-black/35 px-1.5 py-0.5 rounded text-[9px] text-indigo-400">{"{{nodes." + node.id + ".tokenUsage.totalTokens}}"}</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'emailNode':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Recipient Email (To)
              </label>
              <input
                type="text"
                value={config.to || ''}
                onChange={(e) => handleFieldChange('to', e.target.value)}
                placeholder="e.g. {{trigger.email}} or user@domain.com"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Email Subject
              </label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                placeholder="e.g. Summary from FlowGenius AI"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Email Body
              </label>
              <textarea
                value={config.body || ''}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                placeholder="Write your email body. Supports mustache mapping tokens."
                rows={5}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Attachment Path(s) (Optional)
              </label>
              <input
                type="text"
                value={config.attachments || ''}
                onChange={(e) => handleFieldChange('attachments', e.target.value)}
                placeholder="e.g. {{nodes.sheets_node_id.filePath}} or comma-separated paths"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              />
              <p className="text-[9px] text-gray-500 mt-1">
                Enter a file path or dynamic reference. You can specify multiple paths separated by commas.
              </p>
            </div>
          </div>
        );

      case 'httpNode':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Method
                </label>
                <select
                  value={config.method || 'GET'}
                  onChange={(e) => handleFieldChange('method', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  API Endpoint URL
                </label>
                <input
                  type="text"
                  value={config.url || ''}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  placeholder="https://api.external.com/v1"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Headers (JSON)
              </label>
              <textarea
                value={config.headers ? JSON.stringify(config.headers, null, 2) : '{\n  "Content-Type": "application/json"\n}'}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleFieldChange('headers', parsed);
                  } catch (err) {}
                }}
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-500"
              />
            </div>

            {config.method !== 'GET' && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Request Body
                </label>
                <textarea
                  value={config.body || ''}
                  onChange={(e) => handleFieldChange('body', e.target.value)}
                  placeholder="Request body payload (supports mapping syntax)"
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        );

      case 'dbNode':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Target DB Collection
              </label>
              <input
                type="text"
                value={config.collectionName || 'leads'}
                onChange={(e) => handleFieldChange('collectionName', e.target.value)}
                placeholder="e.g. leads, logs, summaries"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Data Document (JSON)
              </label>
              <textarea
                value={config.document ? JSON.stringify(config.document, null, 2) : '{\n  "email": "{{trigger.email}}",\n  "summary": "{{nodes.geminiNodeId.output}}"\n}'}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleFieldChange('document', parsed);
                  } catch (err) {}
                }}
                rows={5}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 'sheetsNode':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Action Type
              </label>
              <select
                value={config.action || 'append'}
                onChange={(e) => handleFieldChange('action', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="append">Append Row</option>
                <option value="export">Export Spreadsheet</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Spreadsheet ID
              </label>
              <input
                type="text"
                value={config.spreadsheetId || ''}
                onChange={(e) => handleFieldChange('spreadsheetId', e.target.value)}
                placeholder="Google Sheet alphanumeric ID"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              />
            </div>

            {(!config.action || config.action === 'append') ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Sheet Range
                  </label>
                  <input
                    type="text"
                    value={config.range || 'Sheet1!A:C'}
                    onChange={(e) => handleFieldChange('range', e.target.value)}
                    placeholder="e.g. Sheet1!A:C"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Append Row Cell Values (JSON Array)
                  </label>
                  <textarea
                    value={config.rowValues ? JSON.stringify(config.rowValues, null, 2) : '[\n  "{{trigger.email}}",\n  "{{nodes.geminiNodeId.output}}",\n  "Pending"\n]'}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleFieldChange('rowValues', parsed);
                      } catch (err) {}
                    }}
                    rows={4}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Export Format
                  </label>
                  <select
                    value={config.format || 'xlsx'}
                    onChange={(e) => handleFieldChange('format', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="csv">Comma Separated Values (CSV)</option>
                    <option value="pdf">PDF Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Sheet Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={config.sheetName || ''}
                    onChange={(e) => handleFieldChange('sheetName', e.target.value)}
                    placeholder="e.g. Sheet1"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex items-start gap-2 text-[9px] text-indigo-300">
                  <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>Export Output Variables:</span>
                    <ul className="list-disc pl-3 space-y-0.5">
                      <li>File Path: <code className="bg-black/35 px-1.5 py-0.5 rounded text-[9px] text-indigo-400">{"{{nodes." + node.id + ".filePath}}"}</code></li>
                      <li>File Name: <code className="bg-black/35 px-1.5 py-0.5 rounded text-[9px] text-indigo-400">{"{{nodes." + node.id + ".fileName}}"}</code></li>
                      <li>Mime Type: <code className="bg-black/35 px-1.5 py-0.5 rounded text-[9px] text-indigo-400">{"{{nodes." + node.id + ".mimeType}}"}</code></li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-80 border-l border-neutral-900 bg-neutral-950 p-5 flex flex-col justify-between h-full overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-wider uppercase mb-1">
            Node Configuration
          </h3>
          <p className="text-[10px] text-gray-500">Configure settings and data mapping variables.</p>
        </div>

        {/* Global Node Identity details */}
        <div className="space-y-3.5 border-b border-neutral-900 pb-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Step Display Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => handleMetadataChange('label', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Step Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => handleMetadataChange('description', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Node configuration inputs based on Type */}
        <div className="space-y-5">{renderConfigFields()}</div>
      </div>

      <div className="pt-6 mt-6 border-t border-neutral-900">
        <button
          type="button"
          onClick={() => onDeleteNode(node.id)}
          className="w-full bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl py-2.5 text-xs font-semibold active:scale-[0.98] transition-all"
        >
          Delete Node Block
        </button>
      </div>
    </aside>
  );
};
