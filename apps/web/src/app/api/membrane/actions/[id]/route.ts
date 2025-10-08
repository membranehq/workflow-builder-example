import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/server-auth'
import { generateIntegrationToken } from '@/lib/integration-token'
import { IntegrationAppClient } from '@membranehq/sdk'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(request)
    if (!auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await generateIntegrationToken(auth)

    const client = await new IntegrationAppClient({
      token,
    })

    const { id } = await params
    const action = await client.action(id).get()

    return NextResponse.json({ action }, { status: 200 })
  } catch (error) {
    console.error('Error fetching Membrane action by ID:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
