import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, WorkflowRun } from '@repo/shared'
import { Workflow } from '@/models/workflow'

export async function GET(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params

    await connectToDatabase()

    const run = await WorkflowRun.findOne({
      _id: runId,
    }).lean()

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    // Get workflow details
    const workflow = await Workflow.findById(run.workflowId).lean()
    const runWithWorkflow = {
      ...run,
      workflow: workflow
        ? {
            _id: workflow._id,
            name: workflow.name,
            description: workflow.description,
          }
        : null,
    }

    return NextResponse.json({ run: runWithWorkflow })
  } catch (error) {
    console.error('Failed to fetch run:', error)
    return NextResponse.json({ error: 'Failed to fetch run' }, { status: 500 })
  }
}
