import { DataSchema } from '@membranehq/sdk'
import { WorkflowNode } from '@/app/workflows/[id]/components/types/workflow'
import { IntegrationAppClient } from '@membranehq/sdk'
import { generateIntegrationToken } from './integration-token'
import type { AuthCustomer } from './auth'

export interface NodeOutputSchema {
  nodeId: string
  outputSchema: DataSchema
}

/**
 * Calculates the output schema for a single node based on its type and configuration
 */
export async function calculateNodeOutputSchema(
  node: WorkflowNode,
  previousNodeSchemas: Map<string, DataSchema>,
  auth: AuthCustomer,
): Promise<DataSchema> {
  const membrane = new IntegrationAppClient({ token: await generateIntegrationToken(auth) })

  try {
    // For trigger nodes
    if (node.type === 'trigger') {
      if (node.triggerType === 'manual' && node.config?.inputSchema) {
        return node.config.inputSchema as DataSchema
      }

      if (node.triggerType === 'event' && node.config?.integrationKey && node.config?.dataCollection) {
        const collection = await membrane
          .connection(node.config.integrationKey as string)
          .dataCollection(node.config.dataCollection as string)
          .get()
        return collection.fieldsSchema as DataSchema
      }
      // For event triggers, return empty schema for now
      return {
        type: 'object',
        properties: {
          FALLBACK: {
            type: 'object',
            properties: {},
          },
        },
      }
    }

    // For http nodes
    if (node.nodeType === 'http') {
      if (node.config?.outputSchema) {
        return node.config.outputSchema as DataSchema
      }
      return { type: 'object', properties: {} }
    }

    // For action nodes
    if (node.type === 'action') {
      if (node.nodeType === 'ai') {
        return node.config?.outputSchema as DataSchema
      }

      if (node.nodeType === 'action' && node.config?.actionId) {
        const action = await membrane.action(node.config.actionId as string).get()

        return action.outputSchema as DataSchema
      }
      return { type: 'object', properties: {} }
    }

    // Default fallback for any other node types
    return { type: 'object', properties: {} }
  } catch (error) {
    console.error(`Error calculating output schema for node ${node.id}:`, error)
    return { type: 'object', properties: {} }
  }
}

/**
 * Calculates output schemas for all nodes in a workflow
 * This function processes nodes in order and calculates each node's output schema
 * based on its configuration and the schemas of previous nodes
 */
export async function calculateWorkflowOutputSchemas(
  nodes: WorkflowNode[],
  auth: AuthCustomer,
): Promise<NodeOutputSchema[]> {
  const nodeSchemas = new Map<string, DataSchema>()
  const results: NodeOutputSchema[] = []

  // Process nodes in order
  for (const node of nodes) {
    const outputSchema = await calculateNodeOutputSchema(node, nodeSchemas, auth)

    // Store the schema for this node
    nodeSchemas.set(node.id, outputSchema)

    // Add to results
    results.push({
      nodeId: node.id,
      outputSchema,
    })
  }

  return results
}

/**
 * Updates workflow nodes with their calculated output schemas
 */
export async function updateNodesWithOutputSchemas(nodes: WorkflowNode[], auth: AuthCustomer): Promise<WorkflowNode[]> {
  const outputSchemas = await calculateWorkflowOutputSchemas(nodes, auth)

  // Create a map for quick lookup
  const schemaMap = new Map(outputSchemas.map((s) => [s.nodeId, s.outputSchema]))

  // Update nodes with their output schemas
  return nodes.map((node) => ({
    ...node,
    outputSchema: schemaMap.get(node.id) || { type: 'object', properties: {} },
  }))
}
