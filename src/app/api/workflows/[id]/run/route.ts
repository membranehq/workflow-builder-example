import { NextRequest, NextResponse } from 'next/server'
import { createTemporalClient } from '@/lib/temporal/client'
import { executeWorkflow } from '@/lib/temporal/workflows'
import { connectToDatabase } from '@/lib/mongodb'
import { Workflow } from '@/models/workflow'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params
    await connectToDatabase()

    // Verify workflow exists
    const workflow = await Workflow.findById(workflowId)
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Create Temporal client and start the workflow
    const client = await createTemporalClient()

    // Start the workflow function
    const workflowHandle = await client.workflow.start(executeWorkflow, {
      args: [workflowId],
      taskQueue: 'workflow-queue',
      workflowId: `workflow-${workflowId}-${Date.now()}`,
    })

    // Wait for the workflow to complete and get the result
    const results = await workflowHandle.result()

    await client.connection.close()

    // Update lastRunAt timestamp
    await workflow.updateLastRun()

    return NextResponse.json({
      message: 'Workflow executed successfully',
      workflowId,
      results: results,
    })
  } catch (error) {
    console.error('Error running workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
