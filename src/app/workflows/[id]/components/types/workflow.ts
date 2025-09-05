import { Node, Edge } from '@xyflow/react'
import { DataSchema } from '@membranehq/sdk'
import { HttpMethod, NodeType } from '@/lib/temporal/types'

export interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action'
  integrationKey: string
  connectionId: string
  flowKey: string
  parametersSchema?: DataSchema
  instanceKey?: string
  actionKey?: string
  inputMapping: Record<string, unknown>
}

export interface FlowBlock {
  data: {
    label: string
    node: WorkflowNode
    onDelete: (nodeId: string) => void
  }
  id: string
  selected: boolean
}

export interface WorkflowEdge extends Edge {
  data: {
    createNewNode: (afterId: string) => void
  }
}

export interface NodeDialogProps {
  mode: 'create' | 'configure'
  node?: WorkflowNode | null
  open: boolean
  onClose: () => void
  onSubmit: (node: Omit<WorkflowNode, 'id'>) => void
}

export interface PlusNodeProps {
  data: {
    parentId: string
    createNewNode: (afterId: string) => void
  }
}

export interface ConnectionEdgeProps {
  id: string
  source: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  data: {
    createNewNode: (afterId: string) => void
  }
}

export type FlowNode = Node<{
  label: string
  node: WorkflowNode
  onDelete: (nodeId: string) => void
}>

export interface Action {
  key: string
  name: string
  inputSchema?: DataSchema
}

////////////////////////

export type NewNativeNodeData = {
  name: string
  type: NodeType
  configuration: Record<string, unknown>
}

export type NativeNodeData = NewNativeNodeData & {
  id: string
}

export type NewHttpNodeData = NewNativeNodeData & {
  type: 'http'
  configuration: {
    uri: string
    method: HttpMethod
    headers: Record<string, string>
    queryParameters?: Array<{ key: string; value: string }>
  }
}

export type HttpNodeData = NewHttpNodeData & {
  id: string
}

export type NewFilterNodeData = NewNativeNodeData & {
  type: 'filter'
  configuration: {
    condition: string
    dataPath: string
  }
}

export type FilterNodeData = NewFilterNodeData & {
  id: string
}
