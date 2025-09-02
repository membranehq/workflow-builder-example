import type { ActionRunResponse } from '@membranehq/sdk'
import { proxyActivities } from '@temporalio/workflow'

import type { AuthCustomer } from '../auth'

import type * as activities from './activities'

const { fetchWorkflow, executeNode } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

export async function integrationWorkflow(auth: AuthCustomer, workflowId: string): Promise<ActionRunResponse[]> {
  const definition = await fetchWorkflow(workflowId)

  const results: ActionRunResponse[] = []

  for (const node of definition.nodes) {
    const result = await executeNode({ auth, node })
    results.push(result)
  }

  return results
}
