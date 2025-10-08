import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/server-auth'
import { generateIntegrationToken } from '@/lib/integration-token'
import { IntegrationAppClient } from '@membranehq/sdk'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request)
    if (!auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await generateIntegrationToken(auth)

    const client = await new IntegrationAppClient({
      token,
    })

    const actions = await client.actions.findAll({
      
    })

    return NextResponse.json({ actions: actions }, { status: 200 })
  } catch (error) {
    console.error('Error fetching Membrane actions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
