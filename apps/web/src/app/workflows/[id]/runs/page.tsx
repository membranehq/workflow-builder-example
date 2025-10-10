'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authenticatedFetcher } from '@/lib/fetch-utils'
import { PageWrapper } from '@/components/page-wrapper'

interface WorkflowRun {
  _id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  input?: unknown
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
}

interface Workflow {
  _id: string
  name: string
  description?: string
}

export default function WorkflowRunsPage() {
  const { id } = useParams()
  const router = useRouter()
  const workflowId = Array.isArray(id) ? id[0] : (id as string)

  // Fetch workflow details
  const { data: workflow, isLoading: isLoadingWorkflow } = useSWR<Workflow>(
    workflowId ? `/api/workflows/${workflowId}` : null,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  // Fetch runs with SWR
  const { data: runs, isLoading: isLoadingRuns } = useSWR<WorkflowRun[]>(
    workflowId ? `/api/workflows/${workflowId}/runs` : null,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      // Auto-refresh every 3 seconds if there are running workflows
      refreshInterval: (data) => {
        const hasRunningWorkflows = data?.some(run => run.status === 'running')
        return hasRunningWorkflows ? 3000 : 0
      },
    }
  )

  const isLoading = isLoadingWorkflow || isLoadingRuns

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="h-3 w-3 rounded-full bg-green-600" />
      case 'failed':
        return <div className="h-3 w-3 rounded-full bg-red-600" />
      case 'running':
        return <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const formatDuration = (executionTime?: number) => {
    if (!executionTime) return 'N/A'
    return `${executionTime}ms`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <PageWrapper className="h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-800 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-4 px-4">
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 py-3">
          <div className="flex items-center gap-2">
            {workflow && (
              <>
                <Link href={`/workflows/${workflowId}`}>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer">
                    {workflow.name}
                  </h1>
                </Link>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </>
            )}
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Runs
            </h1>
          </div>
        </div>

        {/* Runs List */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {!runs || runs.length === 0 ? (
              <div className="text-center py-8">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No runs yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Run your workflow to see execution history here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {runs.map((run) => (
                  <div
                    key={run._id}
                    onClick={() => router.push(`/workflows/${workflowId}/runs/${run._id}`)}
                    className="py-4 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(run.status)}
                        <div className="flex items-center gap-2">
                          {getStatusBadge(run.status)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(run.startedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {run.executionTime && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDuration(run.executionTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
