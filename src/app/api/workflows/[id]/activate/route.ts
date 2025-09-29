import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Workflow } from '@/models/workflow'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()

    const workflow = await Workflow.findById(id)

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Use the custom instance method
    await workflow.activate()

    return NextResponse.json(workflow.toObject())
  } catch (error) {
    console.error('Failed to activate workflow:', error)
    return NextResponse.json({ error: 'Failed to activate workflow' }, { status: 500 })
  }
}
