import { NextRequest, NextResponse } from 'next/server'
import {
  connectToDatabase,
  WorkflowRun,
  createTemporalClient,
  TEMPORAL_CONFIG,
  executeWorkflow,
  type WorkflowNode,
} from '@repo/shared'
import { Workflow } from '@/models/workflow'
import { getAuthFromRequest } from '@/lib/server-auth'
import { generateIntegrationToken } from '@/lib/integration-token'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    // Parse the request body as the event data
    let eventData: Record<string, unknown> = {}
    try {
      eventData = await request.json()
    } catch (error) {
      console.error('Invalid JSON in request body:', error)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Get workflow ID from query parameters or headers
    const url = new URL(request.url)
    const workflowId = url.searchParams.get('workflowId') || request.headers.get('x-workflow-id')

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }

    // Find the workflow
    const workflow = await Workflow.findById(workflowId)
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check if workflow is active
    if (workflow.status !== 'active') {
      return NextResponse.json({ error: 'Workflow is not active' }, { status: 400 })
    }

    console.log('Ingesting event for workflow:', workflowId, 'Event data:', eventData)

    // Create a workflow run record before starting execution
    const workflowRun = await WorkflowRun.create({
      workflowId: workflowId,
      status: 'running',
      input: eventData, // Use the entire request body as trigger input
      nodesSnapshot: workflow.nodes, // Capture snapshot of nodes at execution time
      results: [],
      summary: {
        totalNodes: workflow.nodes.length,
        successfulNodes: 0,
        failedNodes: 0,
        successRate: 0,
      },
      startedAt: new Date(),
    })

    // Create Temporal client and start the workflow
    const client = await createTemporalClient()
    const auth = getAuthFromRequest(request)

    const membraneToken = await generateIntegrationToken(auth)

    const temporalWorkflowId = `ingest-${workflowId}-${Date.now()}`

    // Start the workflow execution asynchronously
    await client.workflow.start(executeWorkflow, {
      args: [workflow.nodes as WorkflowNode[], membraneToken, eventData, workflowRun._id.toString()],
      taskQueue: TEMPORAL_CONFIG.TASK_QUEUE_NAME,
      workflowId: temporalWorkflowId,
    })

    console.log(
      `Started workflow execution from ingest. Run ID: ${workflowRun._id}, Temporal ID: ${temporalWorkflowId}`,
    )

    // Close the Temporal connection
    await client.connection.close()

    // Update lastRunAt timestamp
    await workflow.updateLastRun()

    // Return immediately with success response
    return NextResponse.json(
      {
        success: true,
        message: 'Event ingested and workflow started',
        workflowId,
        runId: workflowRun._id.toString(),
        temporalWorkflowId,
        timestamp: new Date().toISOString(),
      },
      { status: 202 },
    ) // 202 Accepted - request accepted but processing asynchronously
  } catch (error) {
    console.error('Error ingesting event:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to ingest event and start workflow',
      },
      { status: 500 },
    )
  }
}

// Optional: Add a GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'ingest/events',
    timestamp: new Date().toISOString(),
  })
}
