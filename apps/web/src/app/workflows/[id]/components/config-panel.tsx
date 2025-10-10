import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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

interface ConfigPanelProps {
  selectedNode: WorkflowNode | null
  onClose: () => void
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

export function ConfigPanel({ selectedNode, onClose, onUpdateNode, nodeTypes, triggerTypes }: ConfigPanelProps) {
  const { workflow } = useWorkflow()
  const [formData, setFormData] = useState<Omit<WorkflowNode, 'id'> | undefined>()
  const [variableSchema, setVariableSchema] = useState<DataSchema>({ type: 'object', properties: {} })
  const [isSaving, setIsSaving] = useState(false)

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

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode)
    }
  }, [selectedNode])

  const handleSubmit = async (e: React.FormEvent) => {
    if (!formData) return

    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      const updateData = { ...formData }

      // For triggers, ensure triggerType is preserved
      if (selectedNode?.type === 'trigger') {
        updateData.triggerType = formData.triggerType
      } else {
        // For actions, ensure nodeType is set
        updateData.nodeType = formData.nodeType || DEFAULT_NODE_TYPE
      }

      onUpdateNode(updateData)
    } catch (error) {
      console.error('Failed to save node:', error)
    } finally {
      setIsSaving(false)
    }
  }

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
    <div className='w-[420px] bg-white border-l border-gray-200 flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto p-4'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <NodeEditForm
            name={formData.name}
            onNameChange={(name) => setFormData((prev) => prev ? { ...prev, name } : undefined)}
            selectedType={selectedNode.type === 'trigger' ? (formData.triggerType || '') : (formData.nodeType || selectedNodeType)}
            onTypeChange={(type) => {
              if (selectedNode.type === 'trigger') {
                setFormData((prev) => prev ? { ...prev, triggerType: type } : undefined)
              } else {
                setFormData((prev) => prev ? { ...prev, nodeType: type } : undefined)
              }
            }}
            availableTypes={selectedNode.type === 'trigger' ? availableTriggerTypes : availableNodeTypes}
            typeLabel={selectedNode.type === 'trigger' ? 'Trigger Type' : 'Node Type'}
            nameLabel='Name'
            namePlaceholder='Enter node name'
            disabled={isSaving}
          />

          {selectedNode.type === 'trigger' && selectedTriggerTypeConfig && formData.triggerType === 'manual' && (
            <ManualTriggerConfig
              value={formData}
              onChange={(updatedNode) => {
                setFormData(updatedNode)
              }}
            />
          )}

          {selectedNode.type === 'trigger' && selectedTriggerTypeConfig && formData.triggerType === 'event' && (
            <EventTriggerConfig
              value={formData}
              onChange={(updatedNode) => {
                setFormData(updatedNode)
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
                setFormData(configuration)
              }}
            />
          )}

          {selectedNode.type === 'action' && selectedNodeType === 'http' && selectedNodeTypeConfig && (
            <HttpRequestConfig
              variableSchema={variableSchema}
              value={formData}
              nodeTypeConfig={selectedNodeTypeConfig}
              onChange={(configuration) => {
                setFormData(configuration)
              }}
            />
          )}
        </form>
      </div>

      <div className='p-4 border-t border-gray-200'>
        <div className='flex justify-end gap-3'>
          <Button variant='outline' onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim() || isSaving}>
            {isSaving ? 'Saving...' : 'Update'}
          </Button>
        </div>
      </div>
    </div>
  )
}
