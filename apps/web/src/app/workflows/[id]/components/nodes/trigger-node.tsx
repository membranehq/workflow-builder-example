import { ZapIcon } from 'lucide-react'
import { BaseNode } from './base-node'
import { WorkflowNode } from '../types/workflow'
import { TriggerType } from '@/lib/node-types'
import { useIntegration } from '@membranehq/react'
import Image from 'next/image'
import { useMemo } from 'react'

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
    viewOnly?: boolean
    nodeState?: {
      status: 'pending' | 'success' | 'error'
      isDisabled: boolean
    }
    isDisabled?: boolean
    hasResults?: boolean
  }
  selected?: boolean
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  // Get integration key from node config for membrane triggers
  const integrationKey = data.node?.config?.integrationKey as string

  // Memoize the integration key to prevent unnecessary re-renders
  const memoizedIntegrationKey = useMemo(() => integrationKey, [integrationKey])

  // Use the memoized integration key to ensure stable integration data
  const { integration } = useIntegration(memoizedIntegrationKey)

  // Determine trigger type and display info - memoized to prevent unnecessary re-renders
  const triggerInfo = useMemo(() => {
    if (data.triggerTypeMetadata && data.node?.triggerType) {
      // For event triggers, show collection name and event type in title
      if (data.node.triggerType === 'event' && data.node.config?.dataCollection && data.node.config?.eventType) {
        const collectionName = data.node.config.dataCollection as string
        const eventType = data.node.config.eventType as string
        const collectionNameLabel = collectionName.charAt(0).toUpperCase() + collectionName.slice(1) // Capitalize first letter
        const eventTypeLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1) // Capitalize first letter

        return {
          title: `${collectionNameLabel}: ${eventTypeLabel}`,
          logoTitle: integration?.name || 'Integration',
          color: data.triggerTypeMetadata.color
        }
      }

      // For other trigger types, use the trigger type metadata name
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
  }, [data.triggerTypeMetadata, data.node?.triggerType, data.node?.config?.dataCollection, data.node?.config?.eventType, data.label, data.node?.name, integration?.name])

  // Determine which icon to show - memoized to prevent unnecessary re-renders
  const icon = useMemo(() => {
    // For membrane triggers with integration, show integration logo
    if (memoizedIntegrationKey && integration) {
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
  }, [memoizedIntegrationKey, integration, data])

  if (data.isEmpty) {
    return (
      <div className='relative w-[240px]'>
        <div className='border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-2 h-[48px] flex items-center justify-center shadow-sm'>
          <div className='flex items-center gap-3'>
            <div className='w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm'>
              <ZapIcon className='w-3 h-3 text-gray-500' />
            </div>
            <button
              className='px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-md font-medium transition-all duration-200 text-sm flex items-center gap-2 shadow-sm'
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

  return (
    <BaseNode
      selected={selected}
      title={triggerInfo.title}
      logoTitle={triggerInfo.logoTitle}
      icon={icon}
      node={data.node}
      onDelete={data.onDelete}
      showTargetHandle={false}
      position={data.position}
      selectedNodeId={data.selectedNodeId}
      viewOnly={data.viewOnly}
      nodeState={data.nodeState}
      isDisabled={data.isDisabled}
      hasResults={data.hasResults}
    />
  )
}
