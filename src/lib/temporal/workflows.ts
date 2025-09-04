import { proxyActivities } from '@temporalio/workflow'

import type { WorkflowNode, WorkflowDefinition, NodeExecutionResult } from './types'

import type * as activities from './activities'

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

  // Convert MongoDB document to WorkflowDefinition
  const workflowDefinition: WorkflowDefinition = {
    id: definition._id.toString(),
    name: definition.name || 'Unnamed Workflow',
    nodes: definition.nodes || [],
  }

  const results: NodeExecutionResult[] = []
  let previousData: unknown = null

  for (const node of workflowDefinition.nodes) {
    // Pass previous data directly as input to the next node
    const nodeWithData = { ...node, inputMapping: (previousData as Record<string, unknown>) || node.inputMapping }

    // Execute the node
    const result = await executeWorkflowNode(nodeWithData)

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
async function executeWorkflowNode(node: WorkflowNode): Promise<NodeExecutionResult> {
  try {
    // Execute the node through Temporal activity
    const output = await executeNode(node)

    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: true,
      output: output.output,
    }
  } catch (error) {
    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXECUTION_ERROR',
        details: error,
      },
    }
  }
}
