'use client'

import { IntegrationAppProvider } from '@membranehq/react'
import { getAuthHeaders } from './auth-provider'

export function IntegrationProvider({ children }: { children: React.ReactNode }) {
  console.log('Integration Provider')

  const fetchToken = async () => {
    console.log('Fetching token')

    const response = await fetch('/api/integration-token', {
      headers: getAuthHeaders(),
    })
    const data = await response.json()

    console.log('Data', data)
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch integration token')
    }

    console.log('Token', data.token)

    return data.token
  }

  return <IntegrationAppProvider fetchToken={fetchToken}>{children}</IntegrationAppProvider>
}
