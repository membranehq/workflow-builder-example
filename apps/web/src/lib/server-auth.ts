import { NextRequest } from 'next/server'
import type { AuthCustomer } from './auth.js'

export function getAuthFromRequest(request: NextRequest): AuthCustomer {
  return {
    customerId: request.headers.get('x-auth-id') ?? '',
    customerName: request.headers.get('x-customer-name') ?? null,
  }
}
