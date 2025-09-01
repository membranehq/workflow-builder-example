import { NextRequest, NextResponse } from 'next/server'
import { getTemporalClient } from '@/lib/temporal'
import { getAuthFromRequest } from '@/lib/server-auth'
import { integrationWorkflow } from '@/lib/workflows/integration-workflow'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params

    const auth = getAuthFromRequest(request)

    // Get Temporal client and start the workflow
    const client = await getTemporalClient()

    // Start the named workflow function
    const handle = await client.workflow.start(integrationWorkflow, {
      // TODO: introduce args type
      args: [auth, workflowId],
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
