'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Clock, CheckCircle, XCircle, Play, Eye } from 'lucide-react'
import Link from 'next/link'
import { authenticatedFetcher } from '@/lib/fetch-utils'

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

export default function WorkflowRunsPage() {
  const { id } = useParams()
  const workflowId = Array.isArray(id) ? id[0] : (id as string)

  // Fetch runs with SWR
  const { data: runs, isLoading } = useSWR<WorkflowRun[]>(
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
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
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href={`/workflows/${workflowId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflow
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Workflow Runs
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
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          {getStatusBadge(run.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatDate(run.startedAt)}
                          </div>
                          {run.completedAt && (
                            <div className="text-gray-500">
                              Completed: {formatDate(run.completedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDuration(run.executionTime)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {run.summary.successRate.toFixed(1)}%
                          </div>
                          <div className="text-gray-500">
                            {run.summary.successfulNodes}/{run.summary.totalNodes} nodes
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/workflows/${workflowId}/runs/${run._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
