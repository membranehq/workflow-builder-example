import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@repo/shared/lib/mongodb'
import { Workflow } from '@/models/workflow'
import { updateNodesWithOutputSchemas } from '@/lib/output-schema-calculator'
import { getAuthFromRequest } from '@/lib/server-auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()

    const workflow = await Workflow.findById(id).lean()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to fetch workflow:', error)
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('PATCH request received')
  try {
    const { id } = await params
    const updateData = await req.json()
    await connectToDatabase()

    // Get auth for schema calculation
    const auth = getAuthFromRequest(req)

    // If nodes are being updated, calculate output schemas
    if (updateData.nodes && Array.isArray(updateData.nodes)) {
      try {
        updateData.nodes = await updateNodesWithOutputSchemas(updateData.nodes, auth)
      } catch (error) {
        console.error('Error calculating output schemas:', error)
        // Continue without output schemas if calculation fails
      }
    }

    const workflow = await Workflow.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to update workflow:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()

    const workflow = await Workflow.findByIdAndDelete(id)

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete workflow:', error)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
