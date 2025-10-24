import { NextResponse } from 'next/server'
import { connectToDatabase, WorkflowRun } from '@repo/shared'
import { Workflow } from '@/models/workflow'

export async function GET() {
  try {
    await connectToDatabase()

    // Get all workflow runs sorted by most recent first
    const runs = await WorkflowRun.find({}).sort({ startedAt: -1 }).lean()

    // Get workflow details for each run
    const runsWithWorkflowDetails = await Promise.all(
      runs.map(async (run) => {
        const workflow = await Workflow.findById(run.workflowId).lean()
        return {
          ...run,
          workflow: workflow
            ? {
                _id: workflow._id,
                name: workflow.name,
                description: workflow.description,
              }
            : null,
        }
      }),
    )

    return NextResponse.json(runsWithWorkflowDetails)
  } catch (error) {
    console.error('Error fetching all workflow runs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
