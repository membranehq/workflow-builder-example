import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { getTemporalClient } from '@/lib/temporal'
import { helloWorldWorkflow } from '@/lib/workflows/hello-world'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db } = await connectToDatabase()

    const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(id) })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Get Temporal client and execute the workflow
    const client = await getTemporalClient()

    const handle = await client.workflow.start(helloWorldWorkflow, {
      taskQueue: 'hello-world-queue',
      workflowId: `hello-world-${id}-${Date.now()}`,
    })

    // Wait for the workflow to complete and get the result
    const result = await handle.result()

    return NextResponse.json({
      message: 'Workflow executed successfully',
      workflowId: id,
      executionId: handle.workflowId,
      result: result,
    })
  } catch (error) {
    console.error('Error running workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
