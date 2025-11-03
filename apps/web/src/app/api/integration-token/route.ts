import { NextResponse, NextRequest } from 'next/server'
import { ensureAuth, getUserData } from '@/lib/ensureAuth'
import { connectToDatabase } from '@repo/shared'

export async function GET(request: NextRequest) {
  ensureAuth(request)

  try {
    await connectToDatabase()

    const { membraneAccessToken } = getUserData(request)

    return NextResponse.json({ token: membraneAccessToken })
  } catch (error) {
    console.error('Error getting integration token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
