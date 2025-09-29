import { ZapIcon } from 'lucide-react'
import { BaseNode } from './base-node'
import { WorkflowNode } from '../types/workflow'
import { TriggerType } from '@/lib/node-types'

interface TriggerNodeProps {
  data: {
    isEmpty?: boolean
    onClick?: () => void
    label?: string
    node?: WorkflowNode
    onDelete?: (nodeId: string) => void
    triggerTypeMetadata?: TriggerType
  }
  selected?: boolean
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  if (data.isEmpty) {
    return (
      <div className='relative w-[400px]'>
        <div className='border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4 h-[80px] flex items-center justify-center'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-gray-200 rounded flex items-center justify-center'>
              <ZapIcon className='w-4 h-4 text-gray-500' />
            </div>
            <button
              className='px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors'
              onClick={data.onClick}
            >
              Trigger
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Determine trigger type and display info
  const getTriggerInfo = () => {
    if (data.triggerTypeMetadata && data.node?.triggerType) {
      return {
        title: data.label || data.node.name,
        subtitle: data.triggerTypeMetadata.name,
        color: data.triggerTypeMetadata.color
      }
    }

    // Fallback for triggers without specific type metadata
    return {
      title: data.label || 'Manual Trigger',
      subtitle: 'Manual Trigger - Start workflow manually',
      color: 'blue'
    }
  }
  const getIconForTriggerType = () => {
    const Icon = data.triggerTypeMetadata?.icon
    if (Icon) {
      return <Icon className='h-5 w-5 text-gray-700' />
    }
    return <ZapIcon className='h-5 w-5 text-gray-700' />
  }

  const triggerInfo = getTriggerInfo()

  return (
    <BaseNode
      selected={selected}
      icon={getIconForTriggerType()}
      title={triggerInfo.title}
      subtitle={triggerInfo.subtitle}
      node={data.node}
      onDelete={data.onDelete}
      showTargetHandle={false}
    />
  )
}
