'use client'

import axios from 'axios'
import { IntegrationAppProvider } from '@membranehq/react'

export function IntegrationProvider({ children }: { children: React.ReactNode }) {
  const fetchToken = async () => {
    try {
      const response = await axios.get<{ token: string }>('/api/integration-token')
      return response.data.token
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch integration token')
      }
      throw error
    }
  }

  return <IntegrationAppProvider fetchToken={fetchToken}>{children}</IntegrationAppProvider>
}
