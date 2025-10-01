import { BaseNode } from './base-node'
import { WorkflowNode } from '../types/workflow'
import { NodeTypeMetadata } from '@/lib/node-types'

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


  return (
    <BaseNode
      selected={selected}
      icon={data.nodeTypeMetadata?.icon ? (
        <data.nodeTypeMetadata.icon className='w-4 h-4 text-gray-600' />
      ) : null}
      title={nodeInfo.title}
      subtitle={nodeInfo.subtitle}
      node={data.node}
      onDelete={data.onDelete}
    />
  )
}
