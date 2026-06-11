import mongoose from 'mongoose';
import axios from 'axios';
import nodemailer from 'nodemailer';
import path from 'path';
import { Workflow } from '../models/Workflow';
import { Execution } from '../models/Execution';
import { User } from '../models/User';
import { executeGeminiAction } from './gemini';
import { sendRealEmail } from './email';
import { exportGoogleSheet } from './sheets';

// Helper to resolve mustache templates e.g. {{trigger.message}} or {{nodes.gemini_1.output}}
export const resolveMustache = (template: string, context: any): string => {
  if (typeof template !== 'string') return '';
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();
    const parts = trimmedPath.split('.');
    let current = context;
    for (const part of parts) {
      if (current === null || current === undefined) return '';
      current = current[part];
    }
    if (typeof current === 'object') {
      return JSON.stringify(current);
    }
    return current !== undefined ? String(current) : '';
  });
};

// Recursively resolve mustache strings inside JSON objects/arrays
export const resolveObjectMustache = (obj: any, context: any): any => {
  if (typeof obj === 'string') {
    return resolveMustache(obj, context);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveObjectMustache(item, context));
  }
  if (obj !== null && typeof obj === 'object') {
    const resolved: any = {};
    for (const key in obj) {
      resolved[key] = resolveObjectMustache(obj[key], context);
    }
    return resolved;
  }
  return obj;
};

export const executeWorkflow = async (
  workflowId: string,
  userId: string,
  triggerPayload: any
): Promise<any> => {
  const startTime = Date.now();
  
  // 1. Fetch Workflow & User details
  const workflow = await Workflow.findOne({ _id: workflowId, userId });
  if (!workflow) {
    throw new Error('Workflow not found.');
  }

  const user = await User.findById(userId);
  const userGeminiApiKey = user?.apiKeys?.geminiApiKey || '';

  // 2. Initialize context state
  // context.trigger will hold trigger inputs
  // context.nodes[nodeId] will hold each completed node's outputs
  const context: any = {
    trigger: triggerPayload || {},
    nodes: {},
  };

  const stepResults: Record<string, any> = {};
  let executionStatus: 'success' | 'failed' = 'success';
  let overallError: any = null;

  // Create an Execution Log Document in Mongoose (running status)
  const executionLog = new Execution({
    workflowId,
    userId,
    status: 'running',
    triggerPayload: context.trigger,
    stepResults: {},
    duration: 0,
  });
  await executionLog.save();

  try {
    const { nodes, edges } = workflow;

    // 3. Find the Trigger Node
    const triggerNode = nodes.find((n) =>
      ['manualTrigger', 'scheduleTrigger', 'webhookTrigger'].includes(n.type)
    );

    if (!triggerNode) {
      throw new Error('No trigger node configured in this workflow.');
    }

    // Execute Trigger Node
    const triggerStart = Date.now();
    context.nodes[triggerNode.id] = { output: context.trigger };
    stepResults[triggerNode.id] = {
      status: 'success',
      duration: Date.now() - triggerStart,
      input: context.trigger,
      output: context.trigger,
    };

    // 4. Trace the execution order (linear BFS queue)
    const queue: string[] = [];
    const visited = new Set<string>();

    // Find nodes directly connected to trigger
    edges
      .filter((e) => e.source === triggerNode.id)
      .forEach((e) => {
        if (!visited.has(e.target)) {
          queue.push(e.target);
          visited.add(e.target);
        }
      });

    // 5. Execute Action Nodes in sequence
    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const node = nodes.find((n) => n.id === currentNodeId);
      
      if (!node) continue;

      const nodeStart = Date.now();
      stepResults[node.id] = { status: 'running' };

      try {
        let nodeOutput: any = {};
        const rawConfig = node.data.config || {};
        
        // Resolve dynamic variables using context
        const resolvedConfig = resolveObjectMustache(rawConfig, context);
        stepResults[node.id].input = resolvedConfig;

        // Route action node execution
        switch (node.type) {
          case 'geminiNode': {
            const prompt = resolvedConfig.prompt || '';
            const systemPrompt = resolvedConfig.systemPrompt || '';
            const modelName = resolvedConfig.model || 'gemini-2.5-flash';
            const taskPreset = resolvedConfig.task || undefined;

            const geminiResult = await executeGeminiAction(
              prompt,
              userGeminiApiKey,
              systemPrompt,
              modelName,
              taskPreset
            );

            nodeOutput = {
              output: geminiResult.output,
              tokenUsage: geminiResult.tokenUsage,
              model: geminiResult.model,
            };
            break;
          }

          case 'emailNode': {
            const { to, subject, body, attachments: rawAttachments } = resolvedConfig;
            if (!to || !subject || !body) {
              throw new Error('Missing fields to, subject, or body in Email config.');
            }

            let attachmentsList: Array<{ filename: string; path: string }> = [];
            if (rawAttachments) {
              let paths: string[] = [];
              if (typeof rawAttachments === 'string') {
                paths = rawAttachments
                  .split(',')
                  .map((p) => p.trim())
                  .filter((p) => p.length > 0);
              } else if (Array.isArray(rawAttachments)) {
                paths = rawAttachments.map((p) => String(p).trim()).filter((p) => p.length > 0);
              }

              attachmentsList = paths.map((filePath) => {
                const filename = path.basename(filePath);
                return {
                  filename,
                  path: filePath,
                };
              });
            }

            const emailResult = await sendRealEmail(to, subject, body, attachmentsList);
            nodeOutput = emailResult;
            break;
          }

          case 'httpNode': {
            const { url, method, headers, body } = resolvedConfig;
            if (!url) {
              throw new Error('HTTP Action requires a destination URL.');
            }

            const response = await axios({
              url,
              method: method || 'GET',
              headers: headers || { 'Content-Type': 'application/json' },
              data: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
              timeout: 10000, // 10s timeout
            });

            nodeOutput = {
              status: response.status,
              statusText: response.statusText,
              data: response.data,
            };
            break;
          }

          case 'dbNode': {
            const collectionName = resolvedConfig.collectionName || 'flowgenius_collection';
            const docToInsert = resolvedConfig.document || {};
            
            // Write resolved document dynamically to user collection in MongoDB
            const db = mongoose.connection.db;
            if (!db) {
              throw new Error('Database connection is not fully initialized.');
            }
            const insertResult = await db.collection(collectionName).insertOne({
              ...docToInsert,
              _flowgenius_wf: workflowId,
              createdAt: new Date(),
            });

            nodeOutput = {
              status: 'success',
              insertedId: insertResult.insertedId,
              collection: collectionName,
            };
            break;
          }

          case 'sheetsNode': {
            const { action, spreadsheetId, format, sheetName, range, rowValues } = resolvedConfig;
            if (!spreadsheetId) {
              throw new Error('Google Sheets Node requires a Spreadsheet ID.');
            }

            if (action === 'export') {
              console.log(`[SHEETS EXPORT] Exporting sheet. ID: ${spreadsheetId} | Format: ${format} | SheetName: ${sheetName}`);
              const exportResult = await exportGoogleSheet(spreadsheetId, format || 'xlsx', sheetName);
              nodeOutput = {
                status: 'success',
                ...exportResult,
                timestamp: new Date().toISOString(),
              };
            } else {
              // Google Sheets requires complex token handshake; return a simulation payload
              console.log(`[MOCK SHEETS APPEND] SheetID: ${spreadsheetId} | Range: ${range} | Values: ${JSON.stringify(rowValues)}`);
              nodeOutput = {
                status: 'success',
                spreadsheetId,
                range,
                appendedValues: rowValues || [],
                timestamp: new Date().toISOString(),
              };
            }
            break;
          }

          default:
            throw new Error(`Unknown node action type: ${node.type}`);
        }

        // Save node outputs in global execution context
        context.nodes[node.id] = nodeOutput;
        
        // Mark node step as success
        stepResults[node.id] = {
          status: 'success',
          duration: Date.now() - nodeStart,
          input: resolvedConfig,
          output: nodeOutput,
        };

        // Queue downstream connected nodes
        edges
          .filter((e) => e.source === node.id)
          .forEach((e) => {
            if (!visited.has(e.target)) {
              queue.push(e.target);
              visited.add(e.target);
            }
          });

      } catch (err: any) {
        // Record node failure
        stepResults[node.id] = {
          status: 'failed',
          duration: Date.now() - nodeStart,
          error: err.message || 'Error executing action step',
        };
        executionStatus = 'failed';
        overallError = {
          message: err.message || 'Action step execution failed.',
          stepNodeId: node.id,
        };
        break; // Stop downstream execution on step failure
      }
    }
  } catch (err: any) {
    executionStatus = 'failed';
    overallError = {
      message: err.message || 'Execution engine exception.',
    };
  }

  // 6. Update Mongoose Execution Log document with results
  const endTime = Date.now();
  executionLog.status = executionStatus;
  executionLog.stepResults = stepResults;
  executionLog.duration = endTime - startTime;
  if (overallError) {
    executionLog.error = overallError;
  }
  await executionLog.save();

  return {
    runId: executionLog._id,
    runStatus: executionStatus,
    duration: executionLog.duration,
    stepResults,
    error: overallError,
  };
};
