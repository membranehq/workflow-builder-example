import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@repo/shared/lib/mongodb'
import { Workflow } from '@/models/workflow'
import { updateNodesWithOutputSchemas } from '@/lib/output-schema-calculator'
import { getAuthFromRequest } from '@/lib/server-auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('PUT request received')
  try {
    const { id } = await params
    const { nodes } = await req.json()
    await connectToDatabase()

    // Get auth for schema calculation
    const auth = getAuthFromRequest(req)

    // Calculate output schemas for the nodes
    let updatedNodes = nodes
    try {
      updatedNodes = await updateNodesWithOutputSchemas(nodes, auth)
    } catch (error) {
      console.error('Error calculating output schemas:', error)
      // Continue without output schemas if calculation fails
    }

    const workflow = await Workflow.findByIdAndUpdate(id, { $set: { nodes: updatedNodes } }, { new: true }).lean()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to update workflow nodes:', error)
    return NextResponse.json({ error: 'Failed to update workflow nodes' }, { status: 500 })
  }
}
