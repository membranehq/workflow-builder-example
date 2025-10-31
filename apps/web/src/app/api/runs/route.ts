import { NextResponse } from 'next/server'
import { connectToDatabase, WorkflowRun } from '@repo/shared'
import { Workflow } from '@/models/workflow'

export async function GET() {
  try {
    await connectToDatabase()

    // Get only the essential fields for the runs listing page
    // Exclude large fields like results, input, error details
    const runs = await WorkflowRun.find({})
      .select('workflowId status startedAt executionTime')
      .sort({ startedAt: -1 })
      .lean()

    // Get workflow details for each run
    const runsWithWorkflowDetails = await Promise.all(
      runs.map(async (run) => {
        const workflow = await Workflow.findById(run.workflowId).select('name').lean()
        return {
          _id: run._id,
          workflowId: run.workflowId,
          status: run.status,
          startedAt: run.startedAt,
          executionTime: run.executionTime,
          workflow: workflow
            ? {
                _id: workflow._id,
                name: workflow.name,
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
