import { BaseNode } from './base-node'
import { WorkflowNode } from '../types/workflow'
import { NodeTypeMetadata } from '@/lib/node-types'
import { ZapIcon } from 'lucide-react'

interface ActionNodeProps {
  data: {
    label: string
    node: WorkflowNode
    onDelete: (nodeId: string) => void
    nodeTypeMetadata?: NodeTypeMetadata
  }
  selected?: boolean
}

export function ActionNode({ data, selected }: ActionNodeProps) {
  // Get node type metadata for icon and styling
  const getNodeTypeInfo = () => {
    if (data.nodeTypeMetadata && data.node.nodeType) {
      return {
        title: data.label || data.node.name,
        subtitle: data.nodeTypeMetadata.name,
        color: data.nodeTypeMetadata.color
      }
    }

    // Fallback for nodes without specific type metadata
    return {
      title: data.label || 'Action',
      subtitle: 'Action node',
      color: 'blue'
    }
  }

  const nodeInfo = getNodeTypeInfo()

  const getIconForNodeType = () => {
    const Icon = data.nodeTypeMetadata?.icon
    if (Icon) {
      return <Icon className='h-5 w-5 text-gray-700' />
    }
    return <ZapIcon className='h-5 w-5 text-gray-700' />
  }

  return (
    <BaseNode
      selected={selected}
      icon={getIconForNodeType()}
      title={nodeInfo.title}
      subtitle={nodeInfo.subtitle}
      node={data.node}
      onDelete={data.onDelete}
    />
  )
}
