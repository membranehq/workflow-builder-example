'use client'

import React, { Suspense } from 'react'
import { WorkflowNodeRenderer } from '@/app/workflows/[id]/components/workflow-node-renderer'
import { WorkflowProvider, useWorkflow } from '@/app/workflows/[id]/components/workflow-context'
import { WorkflowNode } from '@/app/workflows/[id]/components/types/workflow'
import { Skeleton } from '@/components/ui/skeleton'

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
  nodesSnapshot?: WorkflowNode[]
}

interface WorkflowRunViewerProps {
  run: WorkflowRun
  onNodeClick?: (nodeId: string) => void
}

export function WorkflowRunViewer({ run, onNodeClick }: WorkflowRunViewerProps) {
  const handleNodeClick = (nodeId: string) => {
    if (onNodeClick) {
      onNodeClick(nodeId)
    }
  }

  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <Skeleton className="h-96 w-full" />
      </div>
    }>
      <WorkflowProvider id={run.workflowId}>
        <WorkflowRunViewerContent
          run={run}
          onNodeClick={handleNodeClick}
        />
      </WorkflowProvider>
    </Suspense>
  )
}

function WorkflowRunViewerContent({ run, onNodeClick }: WorkflowRunViewerProps) {
  const { workflow, nodeTypes, triggerTypes } = useWorkflow()

  return (
    <div className="h-full">
      <WorkflowNodeRenderer
        nodes={workflow?.nodes || run.nodesSnapshot || []}
        nodeTypes={nodeTypes}
        triggerTypes={triggerTypes}
        onNodeClick={(event, node) => onNodeClick?.(node.id)}
        viewOnly={true}
        runResults={run.results}
      />
    </div>
  )
}
