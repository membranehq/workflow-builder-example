import { ObjectId } from 'mongodb'
import type { DataSchema } from '@membranehq/sdk'

import { connectToDatabase } from '../mongodb'
import type { AuthCustomer } from '../auth'
import { getIntegrationClient } from '../integration-app-client'

export async function fetchWorkflow(workflowId: string) {
  const { db } = await connectToDatabase()

  const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(workflowId) })

  if (!workflow) {
    throw new Error('Workflow not found')
  }

  return workflow
}

// TODO: place types in some central place; this is good for now
type ActionNode = {
  id: string
  name: string
  // TODO: see why `type` is not being stored in the DB, perhaps needs to be passed when node is created
  type: 'trigger' | 'action'
  integrationKey: string
  connectionId: string
  flowKey: string
  parametersSchema?: DataSchema
  instanceKey?: string
  // TODO: for actionKey to be optional, we need to introduce a new type for nodes that don't have an action
  actionKey: string
  inputMapping: Record<string, unknown>
}

export async function executeNode({ auth, node }: { auth: AuthCustomer; node: ActionNode }) {
  // TODO: add support for try/catch and termination, see how temporal handles it
  const integrationClient = await getIntegrationClient(auth)

  return await integrationClient.connection(node.integrationKey).action(node.actionKey).run(node.inputMapping)
}
