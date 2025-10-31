import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@repo/shared/lib/mongodb'
import { Workflow } from '@/models/workflow'
import { updateNodesWithOutputSchemas } from '@/lib/output-schema-calculator'
import { getAuthFromRequest } from '@/lib/server-auth'
import { IWorkflowNode } from '@/models/workflow'
import { AuthCustomer } from '@/lib/auth'
import { generateIntegrationToken } from '@/lib/integration-token'
import { IntegrationAppClient } from '@membranehq/sdk'
import { getEventIngestUrl } from '@/lib/utils'

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Handle external service calls when a node becomes ready
 * This is where you would register webhooks, create subscriptions, etc.
 */
async function handleNodeReady(node: IWorkflowNode, workflowId: string, auth: AuthCustomer): Promise<void> {
  if (node.type === 'trigger' && node.triggerType === 'event') {
    const config = node.config || {}
    const integrationKey = config.integrationKey as string
    const dataCollection = config.dataCollection as string
    const eventType = config.eventType as string

    const membrane = new IntegrationAppClient({ token: await generateIntegrationToken(auth) })

    /**
     * Create flow instance
     *
     * - Get integration id from key
     * - Create flow instance
     * - Populate nodes
     */
    const integration = await membrane.integration(integrationKey).get()

    if (integration.id && integration.connection?.id) {
      await membrane.flowInstances.create({
        name: `Receive ${capitalize(dataCollection)} ${capitalize(eventType)} Event`,
        connectionId: integration.connection?.id,
        integrationId: integration.id,
        instanceKey: `${workflowId}-${dataCollection}-${eventType}`,
        nodes: {
          [`${eventType}-${dataCollection}`]: {
            name: `${eventType}: ${dataCollection}`,
            type: `data-record-${eventType}-trigger`,
            config: {
              dataSource: {
                collectionKey: dataCollection,
              },
            },
            links: [{ key: 'find-data-record-by-id' }],
          },

          'find-data-record-by-id': {
            type: 'find-data-record-by-id',
            name: 'Find Data Record By Id',
            links: [{ key: 'send-update-to-my-app' }],
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - state and dependencies are custom properties for this flow instance
            state: 'READY',
            dependencies: [],
            config: {
              id: {
                $var: `$.input.${eventType}-${dataCollection}.record.id`,
              },
              dataSource: {
                collectionKey: dataCollection,
              },
            },
            isCustomized: true,
          },

          'send-update-to-my-app': {
            type: 'api-request-to-your-app',
            name: 'Create Data Record in my App',
            config: {
              request: {
                body: {
                  data: {
                    $var: `$.input.${eventType}-${dataCollection}.record`,
                  },
                },
                method: 'POST',
                uri: getEventIngestUrl(workflowId),
              },
            },
            links: [],
            isCustomized: true,
          },
        },
      })
    }
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { nodes } = await req.json()
    await connectToDatabase()

    // Get auth for schema calculation
    const auth = getAuthFromRequest(req)

    // Get existing workflow to check if first node became ready
    const existingWorkflow = await Workflow.findById(id).lean()
    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Calculate output schemas for the nodes
    let updatedNodes = nodes
    try {
      updatedNodes = await updateNodesWithOutputSchemas(nodes, auth)
    } catch (error) {
      console.error('Error calculating output schemas:', error)
      // Continue without output schemas if calculation fails
    }

    // Check if first node is an event trigger with all required fields and update ready status
    let nodesToSave = updatedNodes
    if (updatedNodes.length > 0) {
      const firstNode = updatedNodes[0]
      const wasReady = existingWorkflow.nodes[0]?.ready || false

      if (firstNode.type === 'trigger' && firstNode.triggerType === 'event') {
        const config = firstNode.config || {}
        const integrationKey = config.integrationKey
        const dataCollection = config.dataCollection
        const eventType = config.eventType

        // Set ready to true if all required fields are present
        const isReady = !!(integrationKey && dataCollection && eventType)

        // Create updated first node with ready field
        const updatedFirstNode = {
          ...firstNode,
          ready: isReady,
        }

        // Create new nodes array with updated first node
        nodesToSave = [updatedFirstNode, ...updatedNodes.slice(1)]

        // If node just became ready, trigger external service call
        if (isReady && !wasReady) {
          handleNodeReady(updatedFirstNode, id, auth).catch((error) => {
            console.error(`Failed to handle ready state for node ${updatedFirstNode.id}:`, error)
          })
        }
      }
    }

    const workflow = await Workflow.findByIdAndUpdate(id, { $set: { nodes: nodesToSave } }, { new: true }).lean()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to update workflow nodes:', error)
    return NextResponse.json({ error: 'Failed to update workflow nodes' }, { status: 500 })
  }
}
