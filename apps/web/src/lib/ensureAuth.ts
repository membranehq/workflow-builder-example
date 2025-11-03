import { generateCustomerAccessToken } from './integration-token'
import { getAuthUserFromReqCookies } from './auth-utils'
import { NextRequest, NextResponse } from 'next/server'

export function ensureAuth(request: NextRequest) {
  const user = getAuthUserFromReqCookies(request)

  if (!user) {
    throw new NextResponse('Unauthorized', { status: 401 })
  }

  return user
}

export function getUserData(request: NextRequest) {
  const user = getAuthUserFromReqCookies(request)

  if (!user) {
    throw new Error('User not found')
  }

  /**
   * Generate a membrane access token for the user.
   * This is needed for the user to access the membrane API.
   */

  const token = generateCustomerAccessToken({
    id: user.id,
    name: `${user.email}-${user.id}`,
  })

  return {
    user,
    membraneAccessToken: token,
  }
}
