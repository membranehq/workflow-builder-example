'use client'

import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, History } from 'lucide-react'
import Link from 'next/link'
import { formatTimeAgo } from '@/lib/utils'
import { useRun } from '@/hooks/use-run'
import { WorkflowRunViewer } from './components/workflow-run-viewer'
import { NodeResultViewer } from './components/node-result-viewer'
import { useState } from 'react'

export default function WorkflowRunDetailPage() {
  const { runId } = useParams()
  const resolvedRunId = Array.isArray(runId) ? runId[0] : (runId as string)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const { run, error, isLoading } = useRun(resolvedRunId)

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


  const formatDuration = (executionTime?: number) => {
    if (!executionTime) return 'N/A'
    if (executionTime < 1000) return `${executionTime}ms`
    return `${(executionTime / 1000).toFixed(2)}s`
  }

  const formatDate = (dateString: string) => {
    return formatTimeAgo(dateString)
  }

  if (isLoading) {
    return (
      <>
        <div className="flex flex-col h-screen">
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
          <div className="flex-1 p-8">
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="flex flex-col h-screen">
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-3">
            <div className="flex items-center gap-2">
              <Link href="/runs" className="flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <History className="h-4 w-4" />
                Runs
              </Link>
              <span className="text-base text-gray-500">/</span>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                Error
              </h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {error.message || 'Failed to fetch run'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                The workflow run you are looking for does not exist or has been deleted.
              </p>
              <Link href="/runs">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Runs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!run) {
    return (
      <>
        <div className="flex flex-col h-screen">
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-3">
            <div className="flex items-center gap-2">
              <Link href="/runs" className="flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <History className="h-4 w-4" />
                Runs
              </Link>
              <span className="text-base text-gray-500">/</span>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                Not Found
              </h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Run not found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                The workflow run you are looking for does not exist or has been deleted.
              </p>
              <Link href="/runs">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Runs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col h-screen w-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Breadcrumb navigation on the left */}
            <div className="flex items-center gap-2">
              <Link href="/runs" className="flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <History className="h-4 w-4" />
                Runs
              </Link>
              <span className="text-base text-gray-500">/</span>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                {run.workflow?.name || 'Workflow Run'}
              </h1>
            </div>

            {/* Status badge and timing info on the right */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(run.startedAt)} • {formatDuration(run.executionTime)}
              </div>
              <Badge
                variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}
                className="flex items-center gap-1.5"
              >
                {getStatusIcon(run.status)}
                <span className="capitalize">{run.status}</span>
              </Badge>
            </div>
          </div>
        </div>


        {/* Main Content - Workflow Editor and Node Results */}
        <div className="flex-1 flex">
          <div className="flex-1">
            <WorkflowRunViewer
              run={run}
              onNodeClick={setSelectedNodeId}
            />
          </div>
          <div className="w-96">
            <NodeResultViewer
              selectedNodeId={selectedNodeId}
              runResults={run.results}
            />
          </div>
        </div>
      </div>
    </>
  )
}
