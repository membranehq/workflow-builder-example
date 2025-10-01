import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WorkflowNode } from '../types/workflow'
import { NodeTypeMetadata } from '@/lib/node-types'
import { Action, DataSchema } from '@membranehq/react'
import { MembraneActionConfig } from './membrane-action-config'
import { HttpRequestConfig } from './http-request-config'
import { NodeEditForm } from './node-edit-form'
import { useWorkflow } from '../workflow-context'
import { authenticatedFetcher } from '@/lib/fetch-utils'

interface ActionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (node: Omit<WorkflowNode, 'id'>) => void
  node: WorkflowNode
  nodeTypes: Record<string, NodeTypeMetadata>
}

const DEFAULT_NODE_TYPE = 'action'

const createDefaultNodeData = (): Omit<WorkflowNode, 'id'> => {
  return {
    name: '',
    type: 'action',
    nodeType: DEFAULT_NODE_TYPE,
    inputMapping: {},
  }
}

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
      'Previous Step': {
        type: 'object',
        properties: nodeSchemas,
      },
    },
  }
}

export function EditNodeDialog({ isOpen, onClose, onSubmit, node, nodeTypes }: ActionDialogProps) {
  const { workflow } = useWorkflow()
  const [formData, setFormData] = useState<Omit<WorkflowNode, 'id'>>(createDefaultNodeData())
  const [selectedNodeType, setSelectedNodeType] = useState(DEFAULT_NODE_TYPE)
  const [variableSchema, setVariableSchema] = useState<DataSchema>({ type: 'object', properties: {} })

  // Construct variable schema asynchronously when workflow or node changes
  useEffect(() => {
    const buildSchema = async () => {
      if (!workflow?.nodes) return

      try {
        const schema = await constructVariableSchema(workflow.nodes, node?.id)
        setVariableSchema(schema)
      } catch (error) {
        console.error('Error constructing variable schema:', error)
        setVariableSchema({ type: 'object', properties: {} })
      }
    }

    buildSchema()
  }, [workflow?.nodes, node?.id])

  useEffect(() => {
    if (isOpen && node) {
      setFormData(node)
      setSelectedNodeType((node.nodeType as string) || DEFAULT_NODE_TYPE)
    }
  }, [isOpen, node])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    onSubmit({
      ...formData,
      nodeType: selectedNodeType,
    })
    onClose()
  }

  const availableNodeTypes = Object.values(nodeTypes)
  const selectedNodeTypeConfig = nodeTypes[selectedNodeType]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {(() => {
              const Icon = selectedNodeTypeConfig?.icon as React.ComponentType<{ className?: string }>
              return Icon ? <Icon className='h-4 w-4 text-gray-700' /> : null
            })()}
            Edit Node
          </DialogTitle>
          <DialogDescription>Modify the node settings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <NodeEditForm
            name={formData.name}
            onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
            selectedType={selectedNodeType}
            onTypeChange={setSelectedNodeType}
            availableTypes={availableNodeTypes}
            typeLabel='Node Type'
            nameLabel='Name'
            namePlaceholder='Enter node name'
          />

          {selectedNodeType === 'action' && (
            <MembraneActionConfig
              variableSchema={variableSchema}
              value={formData}
              onChange={(configuration) => {
                setFormData(configuration)
              }}
            />
          )}

          {selectedNodeType === 'http' && selectedNodeTypeConfig && (
            <HttpRequestConfig
              variableSchema={variableSchema}
              value={formData}
              nodeTypeConfig={selectedNodeTypeConfig}
              onChange={(configuration) => {
                setFormData(configuration)
              }}
            />
          )}

          <div className='flex justify-end gap-3'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>Update</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
