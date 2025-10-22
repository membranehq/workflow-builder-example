import React, { useState, useEffect } from 'react'
import { WorkflowNode } from './types/workflow'
import { NodeTypeMetadata, TriggerType } from '@/lib/node-types'
import { DataSchema } from '@membranehq/react'
import { NodeEditForm } from './dialogs/node-edit-form'
import { ManualTriggerConfig } from './dialogs/trigger/manual-trigger-config'
import { EventTriggerConfig } from './dialogs/trigger/event-trigger-config'
import { MembraneActionConfig } from './dialogs/membrane-action-config'
import { HttpRequestConfig } from './dialogs/http-request-config'
import { useWorkflow } from './workflow-context'
import { authenticatedFetcher } from '@/lib/fetch-utils'
import { Action } from '@membranehq/react'
import { useDebounce } from '@/hooks/use-debounce'

interface ConfigPanelProps {
  selectedNode: WorkflowNode | null
  onUpdateNode: (node: Omit<WorkflowNode, 'id'>) => void
  nodeTypes: Record<string, NodeTypeMetadata>
  triggerTypes: Record<string, TriggerType>
}

const DEFAULT_NODE_TYPE = 'action'

/**
 * Schema for all the variables from the previous nodes
 * For membraneAction nodes, fetches the action's outputSchema
 */
const constructVariableSchema = async (nodes: WorkflowNode[], currentNodeId?: string): Promise<DataSchema> => {
  const nodesBeforeCurrent = currentNodeId
    ? nodes.slice(
      0,
      nodes.findIndex((node) => node.id === currentNodeId),
    )
    : nodes

  if (nodesBeforeCurrent.length === 0) {
    return {
      type: 'object',
      properties: {},
    }
  }

  const nodeSchemas: { [key: string]: DataSchema } = {}

  for (const node of nodesBeforeCurrent) {
    let outputSchema: DataSchema

    if (node.nodeType === 'action' && node.config?.actionId) {
      try {
        const data = await authenticatedFetcher<{ action: Action }>(`/api/membrane/actions/${node.config.actionId}`)
        const actionOutputSchema = data.action?.outputSchema || { type: 'object', properties: {} }

        delete actionOutputSchema.title

        outputSchema = actionOutputSchema
      } catch (error) {
        console.error('Error fetching action output schema:', error)
        outputSchema = { type: 'object', properties: {} }
      }
    } else if (node.nodeType === 'http' && node.config?.outputSchema) {
      outputSchema = node.config.outputSchema as DataSchema
    } else if (node.type === 'trigger' && node.triggerType === 'manual' && node.config?.inputSchema) {
      outputSchema = node.config.inputSchema as DataSchema
    } else {
      outputSchema = { type: 'object', properties: {} }
    }

    nodeSchemas[node.name] = outputSchema
  }

  return {
    type: 'object',
    properties: {
      'Previous Steps': {
        type: 'object',
        properties: nodeSchemas,
      },
    },
  }
}

export function ConfigPanel({ selectedNode, onUpdateNode, nodeTypes, triggerTypes }: ConfigPanelProps) {
  const { workflow } = useWorkflow()
  const [formData, setFormData] = useState<WorkflowNode | undefined>()
  const [variableSchema, setVariableSchema] = useState<DataSchema>({ type: 'object', properties: {} })
  const debouncedFormData = useDebounce(formData, 500)

  useEffect(() => {
    const buildSchema = async () => {
      if (!workflow?.nodes || !selectedNode) return

      try {
        const schema = await constructVariableSchema(workflow.nodes, selectedNode?.id)
        setVariableSchema(schema)
      } catch (error) {
        console.error('Error constructing variable schema:', error)
        setVariableSchema({ type: 'object', properties: {} })
      }
    }

    buildSchema()
  }, [workflow?.nodes, selectedNode])

  // Update formData when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode)
    }
  }, [selectedNode])

  // Auto-save when debounced formData changes
  useEffect(() => {
    if (!debouncedFormData || !selectedNode) return

    // Skip if the node name is empty
    if (!debouncedFormData.name.trim()) return

    // Only save if the debounced data is for the currently selected node
    // This prevents saving old data when switching between nodes quickly
    if (debouncedFormData.id !== selectedNode.id) return

    // Skip if this is the initial load (formData matches selectedNode exactly)
    if (JSON.stringify(debouncedFormData) === JSON.stringify(selectedNode)) return

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateData } = debouncedFormData

    // For triggers, ensure triggerType is preserved
    if (selectedNode?.type === 'trigger') {
      updateData.triggerType = debouncedFormData.triggerType
    } else {
      // For actions, ensure nodeType is set
      updateData.nodeType = debouncedFormData.nodeType || DEFAULT_NODE_TYPE
    }

    onUpdateNode(updateData)
  }, [debouncedFormData, selectedNode, onUpdateNode])

  const selectedNodeType = formData?.nodeType || selectedNode?.nodeType || DEFAULT_NODE_TYPE
  const availableNodeTypes = Object.values(nodeTypes)
  const selectedNodeTypeConfig = nodeTypes[selectedNodeType]
  const availableTriggerTypes = Object.values(triggerTypes)
  const selectedTriggerTypeConfig = formData?.triggerType ? triggerTypes[formData.triggerType] : undefined

  // Don't show the panel if workflow has no nodes
  const hasNodes = workflow?.nodes && workflow.nodes.length > 0
  if (!hasNodes) {
    return null
  }

  if (!selectedNode || !formData) {
    return (
      <div className='w-[420px] bg-white border-l border-gray-200 p-6 flex items-center justify-center'>
        <div className='text-center text-gray-500'>
          <p className='text-lg font-medium'>No node selected</p>
          <p className='text-sm'>Click on a node to configure it</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-[420px] bg-white border-l border-gray-200 flex flex-col overflow-y-auto'>
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='space-y-4'>
          {selectedNode.type === 'trigger' && selectedTriggerTypeConfig && formData.triggerType === 'manual' && (
            <ManualTriggerConfig
              value={formData}
              onChange={(updatedNode) => {
                setFormData((prev) => prev ? { ...updatedNode, id: prev.id } : undefined)
              }}
            />
          )}

          {selectedNode.type === 'trigger' && selectedTriggerTypeConfig && formData.triggerType === 'event' && (
            <EventTriggerConfig
              value={formData}
              onChange={(updatedNode) => {
                setFormData((prev) => prev ? { ...updatedNode, id: prev.id } : undefined)
              }}
              variableSchema={variableSchema}
              triggerTypeConfig={selectedTriggerTypeConfig}
            />
          )}

          {selectedNode.type === 'action' && selectedNodeType === 'action' && (
            <MembraneActionConfig
              variableSchema={variableSchema}
              value={formData}
              onChange={(configuration) => {
                setFormData((prev) => prev ? { ...configuration, id: prev.id } : undefined)
              }}
            />
          )}

          {selectedNode.type === 'action' && selectedNodeType === 'http' && selectedNodeTypeConfig && (
            <HttpRequestConfig
              variableSchema={variableSchema}
              value={formData}
              nodeTypeConfig={selectedNodeTypeConfig}
              onChange={(configuration) => {
                setFormData((prev) => prev ? { ...configuration, id: prev.id } : undefined)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
