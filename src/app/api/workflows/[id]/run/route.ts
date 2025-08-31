import { NextRequest, NextResponse } from 'next/server'
import { getTemporalClient } from '@/lib/temporal'
import { getAuthFromRequest } from '@/lib/server-auth'
import { getIntegrationClient } from '@/lib/integration-app-client'
import { generateIntegrationToken } from '@/lib/integration-token'

// Define the workflow function with a proper name
// async function executeWorkflowActions(workflowId: string, auth: AuthCustomer) {
async function executeWorkflowActions() {
  // Get integration client to execute actions
  try {
    // console.log('Workflow ID', workflowId)
    // console.log('Auth', auth)

    // const integrationClient = await getIntegrationClient(auth)

    // console.log('Integration Client', integrationClient)

    const results: string[] = ['foo']
    //   if (workflow.nodes && workflow.nodes.length > 0) {
    //     for (const node of workflow.nodes) {
    //       if (node.type === 'action') {
    //         try {
    //           // const result = await integrationClient
    //           //   .connection(node.integrationKey)
    //           //   .action(node.actionKey)
    //           //   .run(node.inputMapping)

    //           // results.push({ nodeId: node.id, result })

    //           console.log('Node', node)

    //           /**
    //          *   _id: new ObjectId('68b039dcc90b4020627bdce9'),
    // name: 'Workflow 2',
    // createdAt: 2025-08-28T11:13:32.133Z,
    // nodes: [
    //   {
    //     id: '2',
    //     name: 'HubSpot List Users',
    //     integrationKey: 'hubspot',
    //     connectionId: '68aedcb07a5946dd195fbbb5',
    //     actionKey: 'list-users',
    //     inputMapping: {}
    //   }
    // ],
    // lastExecuted: 2025-08-28T14:25:32.635Z,
    // status: 'running',
    // temporalWorkflowId: 'workflow-68b039dcc90b4020627bdce9-1756391132574',
    // metadata: null,
    // updatedAt: '2025-08-28T14:25:33.234Z'
    //          */

    //           results.push({ nodeId: '123', result: 'test' })
    //         } catch (error) {
    //           console.error(`Error executing node ${node.id}:`, error)
    //           results.push({ nodeId: node.id, error: error.message })
    //         }
    //       }
    //     }
    //   }
    return results
  } catch (error) {
    console.error('Error executing workflow actions:', error)
    return 'Error executing workflow actions'
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params

    console.log('Request', request)

    const auth = getAuthFromRequest(request)
    const token = await generateIntegrationToken(auth)

    console.log('Workflow ID', workflowId)
    console.log('Auth', auth)
    console.log('Token', token)

    // const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(id) })

    // console.log('Workflow', workflow)

    // if (!workflow) {
    //   return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    // }

    // Get Temporal client and start the workflow
    const client = await getTemporalClient()

    // Start the named workflow function
    const handle = await client.workflow.start(executeWorkflowActions, {
      // args: [workflowId, auth],
      taskQueue: 'workflow-queue',
      workflowId: `workflow-${workflowId}-${Date.now()}`,
    })

    // Wait for the workflow to complete and get the result
    const result = await handle.result()

    console.log('Result', result)

    return NextResponse.json({
      message: 'Workflow executed successfully',
      workflowId,
      executionId: handle.workflowId,
      result: result,
    })
  } catch (error) {
    console.error('Error running workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
