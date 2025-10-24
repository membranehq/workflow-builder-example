'use client'

import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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
          <div className="border-b border-gray-200 dark:border-gray-800 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-32" />
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
          <div className="border-b border-gray-200 dark:border-gray-800 py-3">
            <div className="flex items-center gap-4">
              <Link href="/runs">
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
          <div className="border-b border-gray-200 dark:border-gray-800 py-3">
            <div className="flex items-center gap-4">
              <Link href="/runs">
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
        <div className="border-b border-gray-200 dark:border-gray-800 py-3">
          <div className="flex items-center gap-4">
            <Link href="/runs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Runs
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {getStatusIcon(run.status)}
              <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {run.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(run.startedAt)} • {formatDuration(run.executionTime)}
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
