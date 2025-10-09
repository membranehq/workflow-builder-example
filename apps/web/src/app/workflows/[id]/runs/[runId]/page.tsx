'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getAuthHeaders } from '@/lib/fetch-utils'
import { JsonViewer } from '@/components/ui/json-viewer'

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

export default function WorkflowRunDetailPage() {
  const { id, runId } = useParams()
  const workflowId = Array.isArray(id) ? id[0] : (id as string)
  const resolvedRunId = Array.isArray(runId) ? runId[0] : (runId as string)

  const [run, setRun] = useState<WorkflowRun | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRun = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const authHeaders = getAuthHeaders()

      const response = await fetch(`/api/workflows/${workflowId}/runs/${resolvedRunId}`, {
        headers: authHeaders,
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Run not found')
        } else {
          setError('Failed to fetch run')
        }
        return
      }

      const data = await response.json()
      setRun(data.run)
    } catch (error) {
      console.error('Failed to fetch run:', error)
      setError('Failed to fetch run')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (workflowId && resolvedRunId) {
      fetchRun()
    }
  }, [workflowId, resolvedRunId])

  // Auto-refresh when workflow is running
  useEffect(() => {
    if (run && run.status === 'running') {
      const interval = setInterval(() => {
        fetchRun()
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(interval)
    }
  }, [run])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'running':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
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
    if (executionTime < 1000) return `${executionTime}ms`
    return `${(executionTime / 1000).toFixed(2)}s`
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
        <div className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={`/workflows/${workflowId}/runs`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Runs
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error || 'Run not found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The workflow run you are looking for does not exist or has been deleted.
            </p>
            <Link href={`/workflows/${workflowId}/runs`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Runs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/workflows/${workflowId}/runs`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Runs
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Run Details
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(run.startedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(run.status)}
            {getStatusBadge(run.status)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</div>
              <div className="flex items-center gap-2">
                {getStatusIcon(run.status)}
                <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {run.status}
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duration</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDuration(run.executionTime)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Success Rate</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {run.summary.successRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nodes</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {run.summary.successfulNodes}/{run.summary.totalNodes}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Started</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatDate(run.startedAt)}
                </span>
              </div>
              {run.completedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Completed</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDate(run.completedAt)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Execution Time</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatDuration(run.executionTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Input */}
          {run.input && (
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Input
              </h3>
              <JsonViewer data={run.input} />
            </div>
          )}

          {/* Error */}
          {run.error && (
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-4">
                Error
              </h3>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200">
                {run.error}
              </div>
            </div>
          )}

          {/* Node Results */}
          <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Node Execution Results
            </h3>
            <div className="space-y-4">
              {run.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${result.success
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        Node {result.nodeId}
                      </span>
                    </div>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {result.message}
                  </div>
                  {result.output && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Output:
                      </div>
                      <JsonViewer data={result.output} />
                    </div>
                  )}
                  {result.error && (
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <div className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">
                        Error Details:
                      </div>
                      <div className="text-sm text-red-800 dark:text-red-200">
                        {result.error.message}
                      </div>
                      {result.error.code && (
                        <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                          Code: {result.error.code}
                        </div>
                      )}
                      {result.error.details && (
                        <div className="mt-2">
                          <JsonViewer data={result.error.details} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

