import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NodeType, Workflow, WorkflowNode, WorkflowEdge } from '../types';
import { NodeLibrary } from '../components/builder/panels/NodeLibrary';
import { NodeProperties } from '../components/builder/panels/NodeProperties';
import { ExecutionConsole } from '../components/builder/panels/ExecutionConsole';
import WorkflowNodeComponent from '../components/builder/nodes/WorkflowNode';
import api from '../services/api';
import { ArrowLeft, Save, Play, Loader2, Info, Check, AlertCircle } from 'lucide-react';

const nodeTypes = {
  manualTrigger: WorkflowNodeComponent,
  scheduleTrigger: WorkflowNodeComponent,
  webhookTrigger: WorkflowNodeComponent,
  geminiNode: WorkflowNodeComponent,
  emailNode: WorkflowNodeComponent,
  httpNode: WorkflowNodeComponent,
  dbNode: WorkflowNodeComponent,
  sheetsNode: WorkflowNodeComponent,
};

interface BuilderProps {
  workflowId: string | null;
  onNavigateBack: () => void;
}

export const Builder: React.FC<BuilderProps> = ({ workflowId, onNavigateBack }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Fetch workflow details
  const fetchWorkflow = useCallback(async () => {
    if (!workflowId) return;
    try {
      const response = await api.get(`/workflows/${workflowId}`);
      const wf = response.data.workflow;
      setWorkflow(wf);
      
      // Load nodes & edges into React Flow state
      if (wf.nodes) {
        setNodes(wf.nodes.map((n: any) => ({
          ...n,
          data: {
            ...n.data,
            status: undefined // reset statuses
          }
        })));
      }
      if (wf.edges) {
        setEdges(wf.edges);
      }
    } catch (err) {
      console.error('Failed to fetch workflow', err);
      setErrorMsg('Failed to load workflow. Loaded local designer mockup.');
      
      // Mock local fallback
      setNodes([
        {
          id: 'trigger-1',
          type: 'manualTrigger',
          position: { x: 250, y: 150 },
          data: { label: 'Manual Trigger', description: 'Trigger the flow manually', config: { payload: { text: "Hello FlowGenius" } } },
        }
      ]);
    }
  }, [workflowId, setNodes, setEdges]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Connect two nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Drag over handler for HTML5 drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Drop handler to add node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow') as NodeType;

      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeId = `${type}_${Math.random().toString(36).substr(2, 9)}`;
      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: {
          label: type.replace(/Node/g, ' AI').replace(/Trigger/g, ' Trigger').replace(/^[a-z]/, (m) => m.toUpperCase()),
          description: `Configure step parameters for this automation node.`,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Quick click handler to add node
  const handleAddNode = useCallback(
    (type: NodeType) => {
      const position = {
        x: 350 + (nodes.length * 30) % 200,
        y: 200 + (nodes.length * 20) % 150,
      };

      const newNodeId = `${type}_${Math.random().toString(36).substr(2, 9)}`;
      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: {
          label: type.replace(/Node/g, ' AI').replace(/Trigger/g, ' Trigger').replace(/^[a-z]/, (m) => m.toUpperCase()),
          description: `Configure step parameters for this automation node.`,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes]
  );

  // Selection change
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as any);
  }, []);

  // Handle properties panel updates
  const handleUpdateNode = useCallback(
    (nodeId: string, updatedFields: Partial<WorkflowNode>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              ...updatedFields,
              data: {
                ...n.data,
                ...updatedFields.data,
              },
            };
          }
          return n;
        })
      );
      
      // Update selected node state locally
      setSelectedNode((curr) => {
        if (curr && curr.id === nodeId) {
          return {
            ...curr,
            ...updatedFields,
            data: {
              ...curr.data,
              ...updatedFields.data,
            },
          } as any;
        }
        return curr;
      });
    },
    [setNodes]
  );

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  // Save the workflow to the DB
  const handleSaveWorkflow = async () => {
    if (!workflowId) return;
    try {
      setSaveLoading(true);
      setErrorMsg('');
      
      // Format nodes and edges for serialization
      const formattedNodes: WorkflowNode[] = nodes.map((n) => ({
        id: n.id,
        type: n.type as NodeType,
        position: n.position,
        data: {
          label: n.data.label,
          description: n.data.description,
          config: n.data.config || {},
        },
      }));

      const formattedEdges: WorkflowEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }));

      const updated = {
        name: workflow?.name || 'My New Automation',
        description: workflow?.description || '',
        isActive: workflow?.isActive ?? false,
        nodes: formattedNodes,
        edges: formattedEdges,
      };

      await api.put(`/workflows/${workflowId}`, updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg('Failed to save changes. Make sure server is running.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Trigger Execution Engine E2E
  const handleExecuteWorkflow = async () => {
    // 1. Save workflow state first to make sure server runs latest config
    await handleSaveWorkflow();
    
    if (!workflowId) return;

    try {
      setIsExecuting(true);
      setErrorMsg('');
      
      // Seed console with initial logs and set all nodes to "running"
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'running' } })));

      // Call execution API
      const response = await api.post(`/workflows/${workflowId}/execute`, {
        // Feed trigger config payload if manual trigger
        payload: nodes.find(n => n.type === 'manualTrigger')?.data.config?.payload || {}
      });
      
      const { runStatus, stepResults } = response.data;
      
      // Parse execution steps to populate bottom drawer
      const newLogs = Object.entries(stepResults).map(([stepId, result]: [string, any]) => {
        const matchingNode = nodes.find(n => n.id === stepId);
        return {
          nodeId: stepId,
          label: matchingNode ? matchingNode.data.label : 'Workflow Node',
          status: result.status, // 'success' | 'failed'
          duration: result.duration,
          input: result.input,
          output: result.output,
          error: result.error,
        };
      });

      setExecutionLogs(newLogs);

      // Map statuses back onto visual React Flow Nodes
      setNodes((nds) =>
        nds.map((n) => {
          const stepRes = stepResults[n.id];
          return {
            ...n,
            data: {
              ...n.data,
              status: stepRes ? stepRes.status : 'pending',
            },
          };
        })
      );
    } catch (err: any) {
      console.error('Execution error:', err);
      setErrorMsg(err.response?.data?.message || 'Execution failed. Double-check your Node configurations.');
      
      // Reset statuses to failed on crash
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'failed' } })));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#09090C] overflow-hidden">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-neutral-950/80 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateBack}
            className="p-2.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-gray-400 hover:text-white rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workflow?.name || 'Untitled Automation'}
                onChange={(e) => setWorkflow((prev) => prev ? { ...prev, name: e.target.value } : null)}
                className="bg-transparent text-white text-lg font-extrabold focus:bg-neutral-900/50 px-2 py-0.5 rounded-lg border border-transparent focus:border-neutral-800 outline-none"
              />
              <span className={`text-[9px] uppercase font-extrabold tracking-wider border px-2 py-0.5 rounded-md ${
                workflow?.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-neutral-900 text-gray-500 border-neutral-850'
              }`}>
                {workflow?.isActive ? 'Active' : 'Draft'}
              </span>
            </div>
            <input
              type="text"
              value={workflow?.description || ''}
              onChange={(e) => setWorkflow((prev) => prev ? { ...prev, description: e.target.value } : null)}
              placeholder="Describe this workflow..."
              className="bg-transparent text-gray-400 text-xs focus:bg-neutral-900/50 px-2 py-0.5 rounded-lg border border-transparent focus:border-neutral-800 outline-none w-80 truncate"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {errorMsg && (
            <div className="hidden lg:flex items-center gap-1.5 bg-red-950/20 border border-red-500/20 text-red-400 px-3.5 py-2 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          
          <button
            onClick={handleSaveWorkflow}
            disabled={saveLoading}
            className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            {saveLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Save className="w-4 h-4 text-indigo-400" />
            )}
            <span>{saveLoading ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}</span>
          </button>

          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/25"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{isExecuting ? 'Running Test...' : 'Test Run'}</span>
          </button>
        </div>
      </header>

      {/* Main Designer Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Drag/Drop library panel */}
        <NodeLibrary onAddNode={handleAddNode} />

        {/* Middle interactive Canvas */}
        <div
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="flex-1 h-full relative"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={["Backend", "Delete"]}
          >
            <Background color="#1f2937" gap={16} size={1.2} />
            <Controls className="!bg-neutral-900 !border-neutral-800 !text-white !fill-white [&>button]:!border-neutral-850 [&>button]:!bg-neutral-950 [&>button:hover]:!bg-neutral-850" />
            <MiniMap 
              style={{ height: 100, width: 150 }} 
              maskColor="rgba(0, 0, 0, 0.7)" 
              nodeColor={() => '#3b82f6'} 
              className="!bg-neutral-950 !border-neutral-800 [&>rect]:!fill-neutral-900"
            />
          </ReactFlow>
        </div>

        {/* Right configuration sidebar */}
        <NodeProperties
          node={selectedNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
        />
      </div>

      {/* Docked bottom execution trace drawer */}
      <ExecutionConsole
        onExecute={handleExecuteWorkflow}
        isRunning={isExecuting}
        logs={executionLogs}
      />
    </div>
  );
};

export const WorkflowBuilder: React.FC<BuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <Builder {...props} />
    </ReactFlowProvider>
  );
};
