import { NextRequest, NextResponse } from 'next/server'
import { createTemporalClient } from '@/lib/temporal'
import { getAuthFromRequest } from '@/lib/server-auth'
import { integrationWorkflow } from '@/lib/workflows/integration-workflow'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params

    // Auth will be used in the workflow with Membrane SDK
    const auth = getAuthFromRequest(request)

    // Create Temporal client and start the workflow
    const client = await createTemporalClient()

    // Start the named workflow function
    const actionRunResponse = await client.workflow.start(integrationWorkflow, {
      // TODO: introduce args type
      args: [auth, workflowId],
      taskQueue: 'workflow-queue',
      workflowId: `workflow-${workflowId}-${Date.now()}`,
    })

    // Wait for the workflow to complete and get the result
    const result = await actionRunResponse.result()

    console.log('Result', result)

    await client.connection.close()

    return NextResponse.json({
      message: 'Workflow executed successfully',
      workflowId,
      executionId: actionRunResponse.workflowId,
      result: result,
    })
  } catch (error) {
    console.error('Error running workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
