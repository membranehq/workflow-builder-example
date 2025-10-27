import useSWR from 'swr'
import { authenticatedFetcher } from '@/lib/fetch-utils'

interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action'
  nodeType?: string
  triggerType?: string
  config?: Record<string, unknown>
  ready?: boolean
}

interface WorkflowRun {
  _id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  input?: unknown
  nodesSnapshot?: WorkflowNode[]
  results: Array<{
    nodeId: string
    success: boolean
    message: string
    output?: unknown
    error?: {
      message: string
      code?: string
      details?: unknown
    }
  }>
  summary: {
    totalNodes: number
    successfulNodes: number
    failedNodes: number
    successRate: number
  }
  startedAt: string
  completedAt?: string
  executionTime?: number
  error?: string
  workflow?: {
    _id: string
    name: string
    description?: string
  }
}

interface RunResponse {
  run: WorkflowRun
}

export function useRun(runId: string) {
  const { data, error, isLoading, mutate } = useSWR<RunResponse>(
    runId ? `/api/runs/${runId}` : null,
    runId ? (url) => authenticatedFetcher<RunResponse>(url) : null,
    {
      // Auto-refresh every 3 seconds if the run is still running
      refreshInterval: 3000,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Error retry configuration
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    },
  )

  return {
    run: data?.run,
    error,
    isLoading,
    mutate,
  }
}
