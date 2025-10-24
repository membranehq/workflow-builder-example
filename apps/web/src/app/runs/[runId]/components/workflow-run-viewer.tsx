'use client'

import React from 'react'
import { WorkflowEditor } from '@/app/workflows/[id]/components/workflow-editor'
import { WorkflowProvider } from '@/app/workflows/[id]/components/workflow-context'

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
  workflow?: {
    _id: string
    name: string
    description?: string
  }
  nodesSnapshot?: unknown[]
}

interface WorkflowRunViewerProps {
  run: WorkflowRun
  onNodeClick?: (nodeId: string) => void
}

export function WorkflowRunViewer({ run, onNodeClick }: WorkflowRunViewerProps) {

  return (
    <WorkflowProvider id={run.workflowId}>
      <div className="h-full">
        <WorkflowEditor
          viewOnly={true}
          onNodeClick={onNodeClick}
          runResults={run.results}
        />
      </div>
    </WorkflowProvider>
  )
}
