import { ensureAuth, getUserData } from '@/lib/ensureAuth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  ensureAuth(request)

  try {
    const { user } = getUserData(request)

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      message: 'Authentication valid',
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
  }
}
