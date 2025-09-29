import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Workflow } from '@/models/workflow'

export async function POST(req: Request) {
  try {
    const { name, description, userId } = await req.json()
    await connectToDatabase()

    const workflow = await Workflow.create({
      name,
      description,
      userId,
      status: 'draft',
      nodes: [],
    })

    return NextResponse.json({ id: workflow._id, ...workflow.toObject() })
  } catch (error) {
    console.error('Failed to create workflow:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as 'draft' | 'active' | 'inactive' | null

    let workflows

    if (userId) {
      // Use the custom static method
      workflows = await Workflow.findByUser(userId)
    } else if (status) {
      // Use the custom static method
      workflows = await Workflow.findByStatus(status)
    } else {
      workflows = await Workflow.find({}).sort({ createdAt: -1 })
    }

    const workflowsData = workflows.map((w) => (w.toObject ? w.toObject() : w))

    return NextResponse.json(workflowsData)
  } catch (error) {
    console.error('Failed to fetch workflows:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}
