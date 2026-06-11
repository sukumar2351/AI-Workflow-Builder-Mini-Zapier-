import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from './models/User';
import { Workflow } from './models/Workflow';
import { executeWorkflow } from './services/executor';

// Load environment variables
dotenv.config();

async function runTest() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Database connected successfully.');

  try {
    // 1. Create or find test user
    let user = await User.findOne({ email: 'test-user@flowgenius.ai' });
    if (!user) {
      user = new User({
        name: 'Test Attachment User',
        email: 'test-user@flowgenius.ai',
        password: 'password123',
      });
      await user.save();
      console.log('Created test user:', user._id);
    } else {
      console.log('Found existing test user:', user._id);
    }

    // Node IDs
    const triggerId = 'manual-trigger-node';
    const sheetsId = 'sheets-export-node';
    const emailId = 'email-attachment-node';

    // 2. Build test workflow
    const workflowData = {
      userId: user._id,
      name: 'Google Sheets Email Attachment Test Workflow',
      description: 'Test manual trigger, exporting a sheet and emailing it.',
      isActive: true,
      trigger: {
        type: 'manualTrigger',
        triggerNodeId: triggerId,
      },
      nodes: [
        {
          id: triggerId,
          type: 'manualTrigger',
          data: {
            label: 'Manual Trigger',
            config: {
              payload: {
                recipient: 'sukumarkarnam4@gmail.com'
              }
            }
          },
          position: { x: 100, y: 100 }
        },
        {
          id: sheetsId,
          type: 'sheetsNode',
          data: {
            label: 'Google Sheets Export',
            config: {
              action: 'export',
              spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUq1Mw1UEsX29rJNs5U', // Public google sheet for testing
              format: 'xlsx',
              sheetName: 'Sheet1'
            }
          },
          position: { x: 300, y: 100 }
        },
        {
          id: emailId,
          type: 'emailNode',
          data: {
            label: 'Email Node',
            config: {
              to: '{{trigger.recipient}}',
              subject: 'FlowGenius Test: Spreadsheet Delivery',
              body: 'Hi, please find your exported report attached to this email.',
              attachments: `{{nodes.${sheetsId}.filePath}}`
            }
          },
          position: { x: 500, y: 100 }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          source: triggerId,
          target: sheetsId
        },
        {
          id: 'edge-2',
          source: sheetsId,
          target: emailId
        }
      ]
    };

    // Save or update workflow
    let workflow = await Workflow.findOne({ name: workflowData.name, userId: user._id });
    if (workflow) {
      workflow.nodes = workflowData.nodes;
      workflow.edges = workflowData.edges;
      await workflow.save();
      console.log('Updated existing workflow:', workflow._id);
    } else {
      workflow = new Workflow(workflowData);
      await workflow.save();
      console.log('Created new test workflow:', workflow._id);
    }

    // 3. Trigger manual execution
    console.log('Executing test workflow...');
    const result = await executeWorkflow(
      workflow._id.toString(),
      user._id.toString(),
      { recipient: 'sukumarkarnam4@gmail.com' }
    );

    console.log('\n================ EXECUTION COMPLETE ================');
    console.log('Status:', result.runStatus);
    console.log('Duration:', result.duration, 'ms');
    console.log('Error:', result.error);
    console.log('\nStep Results details:');
    
    // Output step results
    for (const [nodeId, res] of Object.entries(result.stepResults)) {
      console.log(`\nNode: ${nodeId}`);
      console.log(`  Status: ${(res as any).status}`);
      console.log(`  Duration: ${(res as any).duration} ms`);
      console.log(`  Output:`, JSON.stringify((res as any).output, null, 2));
    }
    
    console.log('====================================================\n');

  } catch (error) {
    console.error('Execution test runner error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTest();
