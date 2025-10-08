import { proxyActivities } from '@temporalio/workflow'

import type { EnhancedNodeExecutionResult } from './node-execution.js'
import type { WorkflowNode } from './types.js'

import type * as activities from './activities.js'

const { executeWorkflowNodes } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 2,
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
  },
})

/**
 * General-purpose workflow execution with direct result passing
 *
 * This function executes a workflow by passing results from each node to the next,
 * enabling simple data flow without complex dependency management.
 */
export async function executeWorkflow(
  nodes: WorkflowNode[],
  membraneToken: string,
  triggerInput: Record<string, unknown> = {},
  runId?: string,
): Promise<EnhancedNodeExecutionResult[]> {
  return await executeWorkflowNodes(nodes, membraneToken, triggerInput, runId)
}
