import { ZapIcon } from 'lucide-react'
import { BaseNode } from './base-node'
import { WorkflowNode } from '../types/workflow'
import { TriggerType } from '@/lib/node-types'
import { useIntegration } from '@membranehq/react'
import Image from 'next/image'

interface TriggerNodeProps {
  data: {
    isEmpty?: boolean
    onClick?: () => void
    label?: string
    node?: WorkflowNode
    onDelete?: (nodeId: string) => void
    triggerTypeMetadata?: TriggerType
    position?: number
    selectedNodeId?: string | null
  }
  selected?: boolean
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  // Get integration key from node config for membrane triggers
  const integrationKey = data.node?.config?.integrationKey as string
  const { integration } = useIntegration(integrationKey)

  if (data.isEmpty) {
    return (
      <div className='relative w-[240px]'>
        <div className='border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-2 h-[48px] flex items-center justify-center'>
          <div className='flex items-center gap-3'>
            <div className='w-5 h-5 bg-gray-200 rounded flex items-center justify-center'>
              <ZapIcon className='w-3 h-3 text-gray-500' />
            </div>
            <button
              className='px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors text-sm flex items-center gap-2'
              onClick={data.onClick}
            >
              {data.position && (
                <span className='text-xs font-medium'>
                  {data.position}.
                </span>
              )}
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
        logoTitle: data.triggerTypeMetadata.name,
        color: data.triggerTypeMetadata.color
      }
    }

    // Fallback for triggers without specific type metadata
    return {
      title: data.label || 'Manual Trigger',
      logoTitle: 'Manual Trigger - Start workflow manually',
      color: 'blue'
    }
  }

  const triggerInfo = getTriggerInfo()

  // Determine which icon to show
  const getIcon = () => {
    // For membrane triggers with integration, show integration logo
    if (integrationKey && integration) {
      if (integration.logoUri) {
        return (
          <Image
            width={16}
            height={16}
            src={integration.logoUri}
            alt={`${integration.name} logo`}
            className='w-4 h-4 rounded'
          />
        )
      } else {
        // Fallback to first letter of integration name
        return (
          <div className='w-4 h-4 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
            {integration.name[0]}
          </div>
        )
      }
    }

    // For other trigger types, use the trigger type metadata icon
    if (data.triggerTypeMetadata?.icon) {
      return <data.triggerTypeMetadata.icon className='w-4 h-4 text-gray-600' />
    }

    return null
  }

  return (
    <BaseNode
      selected={selected}
      title={triggerInfo.title}
      logoTitle={triggerInfo.logoTitle}
      icon={getIcon()}
      node={data.node}
      onDelete={data.onDelete}
      showTargetHandle={false}
      position={data.position}
      selectedNodeId={data.selectedNodeId}
    />
  )
}
