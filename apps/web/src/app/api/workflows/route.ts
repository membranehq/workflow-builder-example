import { NextResponse } from 'next/server'
import { connectToDatabase } from '@repo/shared/lib/mongodb'
import { Workflow } from '@/models/workflow'

export async function POST(req: Request) {
  try {
    const { name, description, userId } = await req.json()
    await connectToDatabase()

    const workflow = await Workflow.create({
      name,
      description,
      userId,
      status: 'inactive',
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
    const status = searchParams.get('status') as 'active' | 'inactive' | null

    let workflows

    if (userId) {
      // Use the custom static method with lean to get plain objects
      workflows = await Workflow.find({ userId }).sort({ createdAt: -1 }).lean()
    } else if (status) {
      // Use the custom static method with lean to get plain objects
      workflows = await Workflow.find({ status }).sort({ createdAt: -1 }).lean()
    } else {
      workflows = await Workflow.find({}).sort({ createdAt: -1 }).lean()
    }

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Failed to fetch workflows:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}
