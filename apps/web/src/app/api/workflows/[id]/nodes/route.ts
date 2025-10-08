import { NextResponse } from 'next/server'
import { connectToDatabase } from '@repo/shared/lib/mongodb'
import { Workflow } from '@/models/workflow'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { nodes } = await req.json()
    await connectToDatabase()

    const workflow = await Workflow.findByIdAndUpdate(id, { $set: { nodes } }, { new: true }).lean()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to update workflow nodes:', error)
    return NextResponse.json({ error: 'Failed to update workflow nodes' }, { status: 500 })
  }
}
