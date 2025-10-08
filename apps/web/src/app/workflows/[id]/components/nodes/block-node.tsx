import { NodeTypeMetadata } from '@/lib/node-types'
import { BaseNode } from './base-node'
import { WorkflowNode } from '../types/workflow'

interface BlockNodeProps {
  data: {
    label: string
    node: WorkflowNode
    onDelete: (nodeId: string) => void
    nodeTypeMetadata?: NodeTypeMetadata
  }
  selected?: boolean
}

export function BlockNode({ data, selected }: BlockNodeProps) {
  const Icon = data.nodeTypeMetadata?.icon
  return (
    <BaseNode
      selected={selected}
      icon={Icon ? <Icon className='w-4 h-4 text-gray-600' /> : null}
      title={data.label}
      subtitle="Action"
      node={data.node}
      onDelete={data.onDelete}
    />
  )
}
