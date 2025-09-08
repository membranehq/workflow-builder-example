import useSWR from 'swr'
import type { NodeTypesResponse } from '@/types/action-types'
import { NodeType } from '@/lib/temporal/types'

const fetcher = async (url: string): Promise<NodeTypesResponse> => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch node types')
  }

  return response.json()
}

export function useNodeTypes() {
  const { data, error, isLoading, mutate } = useSWR<NodeTypesResponse>('/api/action-types', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Cache for 1 minute
  })

  return {
    nodeTypes: data?.nodeTypes || [],
    nodeTypesByType: data?.nodeTypesByType || {},
    isLoading,
    error,
    mutate,
  }
}

export function useNodeType(nodeType: NodeType) {
  const { nodeTypesByType, isLoading, error } = useNodeTypes()

  return {
    nodeType: (nodeTypesByType as Record<string, unknown>)[nodeType] || undefined,
    isLoading,
    error,
  }
}
