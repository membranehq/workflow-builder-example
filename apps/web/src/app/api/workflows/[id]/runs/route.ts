import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, WorkflowRun } from '@repo/shared'
import { Workflow } from '@/models/workflow'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params

    await connectToDatabase()

    // Verify workflow exists
    const workflow = await Workflow.findById(workflowId)
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Get all workflow runs sorted by most recent first
    const runs = await WorkflowRun.find({ workflowId }).sort({ startedAt: -1 }).lean()

    return NextResponse.json(runs)
  } catch (error) {
    console.error('Error fetching workflow runs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
