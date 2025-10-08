import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, WorkflowRun } from '@repo/shared'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; runId: string }> }) {
  try {
    const { id: workflowId, runId } = await params

    await connectToDatabase()

    const run = await WorkflowRun.findOne({
      _id: runId,
      workflowId: workflowId,
    }).lean()

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    return NextResponse.json({ run })
  } catch (error) {
    console.error('Failed to fetch run:', error)
    return NextResponse.json({ error: 'Failed to fetch run' }, { status: 500 })
  }
}
