import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, WorkflowRun, createTemporalClient, TEMPORAL_CONFIG, executeWorkflow, type WorkflowNode } from '@repo/shared'
import { Workflow } from '@/models/workflow'
import { getAuthFromRequest } from '@/lib/server-auth'
import { generateIntegrationToken } from '@/lib/integration-token'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params
    await connectToDatabase()

    // Verify workflow exists
    const workflow = await Workflow.findById(workflowId)
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    let triggerInput: Record<string, unknown> = {}
    try {
      const body = await request.json()
      triggerInput = body.input || {}

      console.log('Trigger input:', triggerInput)
    } catch {
      // If no body or invalid JSON, use empty trigger input
      console.log('No trigger input provided, using empty object')
    }

    // Create a workflow run record before starting execution
    const workflowRun = await WorkflowRun.create({
      workflowId: workflowId,
      status: 'running',
      input: triggerInput,
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

    const temporalWorkflowId = `workflow-${workflowId}-${Date.now()}`
    await client.workflow.start(executeWorkflow, {
      args: [workflow.nodes as WorkflowNode[], membraneToken, triggerInput, workflowRun._id.toString()],
      taskQueue: TEMPORAL_CONFIG.TASK_QUEUE_NAME,
      workflowId: temporalWorkflowId,
    })

    console.log(`Started workflow execution. Run ID: ${workflowRun._id}, Temporal ID: ${temporalWorkflowId}`)

    // Don't wait for the workflow to complete - return immediately
    await client.connection.close()

    // Update lastRunAt timestamp
    await workflow.updateLastRun()

    // Return the run ID immediately so the frontend can navigate to the runs page
    return NextResponse.json({
      message: 'Workflow started successfully',
      workflowId,
      runId: workflowRun._id.toString(),
      temporalWorkflowId,
    })
  } catch (error) {
    console.error('Error running workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
