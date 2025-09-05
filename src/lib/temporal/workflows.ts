import { proxyActivities } from '@temporalio/workflow'

import type { NodeExecutionResult, ActivityResult } from './types'

import type * as activities from './activities'
import { NativeNodeData } from '@/app/workflows/[id]/components/types/workflow'

const { fetchWorkflow, executeNode } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

/**
 * General-purpose workflow execution with direct result passing
 *
 * This function executes a workflow by passing results from each node to the next,
 * enabling simple data flow without complex dependency management.
 */
export async function executeWorkflow(workflowId: string): Promise<NodeExecutionResult[]> {
  // Fetch workflow definition from database
  const definition = await fetchWorkflow(workflowId)

  // The nodes are already in NativeNodeData format
  const nodes: NativeNodeData[] = definition.nodes || []

  const results: NodeExecutionResult[] = []
  let previousData: unknown = null

  for (const node of nodes) {
    // Execute the node with previous data as context
    const result = await executeWorkflowNode(node, previousData)

    results.push(result)
    // Pass just the output data to the next node
    previousData = result.output
  }

  return results
}

/**
 * Executes a single workflow node
 * This is a placeholder that would be adapted for different workflow systems
 */
async function executeWorkflowNode(node: NativeNodeData, previousData: unknown): Promise<NodeExecutionResult> {
  try {
    // Execute the node through Temporal activity with previous data as context
    const activityResult: ActivityResult = await executeNode(node, { data: previousData })

    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: !activityResult.error,
      input: previousData,
      output: activityResult.output,
      error: activityResult.error
        ? {
            message: activityResult.error.message,
            code: activityResult.error.type,
            details: activityResult.error.details,
          }
        : undefined,
    }
  } catch (error) {
    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: false,
      input: previousData,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXECUTION_ERROR',
        details: error,
      },
    }
  }
}
