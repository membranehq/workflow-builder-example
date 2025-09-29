import { ZapIcon } from 'lucide-react'
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
  return (
    <BaseNode
      selected={selected}
      icon={(() => {
        const Icon = data.nodeTypeMetadata?.icon
        if (Icon) return <Icon className='w-5 h-5 text-gray-700' />
        return <ZapIcon className='w-5 h-5 text-gray-700' />
      })()}
      title={data.label}
      subtitle="Action"
      node={data.node}
      onDelete={data.onDelete}
    />
  )
}
