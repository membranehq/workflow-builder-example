import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@repo/shared/lib/mongodb'
import { Workflow } from '@/models/workflow'
import { ensureAuth, getUserData } from '@/lib/ensureAuth'

export async function POST(req: NextRequest) {
  ensureAuth(req)

  try {
    const { name, description } = await req.json()

    const { user } = getUserData(req)

    await connectToDatabase()

    const workflow = await Workflow.create({
      name,
      description,
      userId: user.id,
      status: 'inactive',
      nodes: [],
    })

    return NextResponse.json({ id: workflow._id, ...workflow.toObject() })
  } catch (error) {
    console.error('Failed to create workflow:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  ensureAuth(req)

  try {
    const { user } = getUserData(req)

    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'active' | 'inactive' | null

    // Build query - always filter by authenticated user's ID
    const query: { userId: string; status?: 'active' | 'inactive' } = {
      userId: user.id,
    }

    // Optionally filter by status
    if (status) {
      query.status = status
    }

    const workflows = await Workflow.find(query).sort({ createdAt: -1 }).lean()

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Failed to fetch workflows:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}
