import { Handle, Position } from '@xyflow/react'
import { WorkflowNode } from '../types/workflow'
import { NodeOptionsMenu } from './node-options-menu'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface BaseNodeProps {
  selected?: boolean
  title: string
  logoTitle?: string
  icon?: React.ReactNode
  node?: WorkflowNode
  onDelete?: (nodeId: string) => void
  onClick?: () => void
  showSourceHandle?: boolean
  showTargetHandle?: boolean
  className?: string
  position?: number
  selectedNodeId?: string | null
  isPlaceholder?: boolean
  viewOnly?: boolean
  nodeState?: {
    status: 'pending' | 'success' | 'error'
    isDisabled: boolean
  }
  isDisabled?: boolean
  hasResults?: boolean
}

export function BaseNode({
  selected,
  title,
  logoTitle,
  icon,
  node,
  onDelete,
  onClick,
  showSourceHandle = true,
  showTargetHandle = true,
  className = '',
  position,
  selectedNodeId,
  isPlaceholder = false,
  viewOnly = false,
  nodeState,
  isDisabled = false,
  hasResults = true,
}: BaseNodeProps) {
  const isSelected = selected || (node && selectedNodeId === node.id)

  // Determine node state styling
  const getNodeStateStyling = () => {
    if (!nodeState) return ''

    switch (nodeState.status) {
      case 'success':
        return 'border-green-500 bg-green-50'
      case 'error':
        return 'border-red-500 bg-red-50'
      case 'pending':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return ''
    }
  }

  const getStatusIcon = () => {
    if (!nodeState) return null

    switch (nodeState.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const baseClasses = `
    flex items-center px-3 py-1.5 rounded-md border w-[240px] shadow-sm
    bg-white border-gray-200
    transition-all duration-200 ease-in-out
    ${isSelected ? 'shadow-xl ring-2 ring-blue-500 border-blue-500 bg-blue-50' : ''}
    ${onClick && !isDisabled && hasResults ? 'cursor-pointer hover:shadow-md hover:border-gray-300 hover:bg-gray-50' : ''}
    ${isDisabled || (viewOnly && !hasResults) ? 'opacity-50 cursor-not-allowed' : ''}
    ${getNodeStateStyling()}
    ${className}
  `

  return (
    <div className='relative'>
      {showTargetHandle && (
        <Handle
          type='target'
          position={Position.Top}
          className='opacity-0! top-0! pointer-events-none!'
          style={{
            top: 0,
            left: '50%',
            width: '0px',
            height: '0px',
            transform: 'translateX(-1px)',
            border: 'none',
            borderRadius: 0,
            background: 'transparent',
          }}
        />
      )}
      <div className={baseClasses} onClick={onClick}>
        <div className='flex flex-col gap-1.5 w-full relative'>
          {/* Integration label section */}
          {logoTitle && (
            <div className=' border border-gray-200 rounded px-1 py-0.5 flex items-center gap-1 w-fit'>
              {icon && <div className='flex-shrink-0'>{icon}</div>}
              <span className='text-[9px] text-gray-700 font-bold'>{logoTitle}</span>
            </div>
          )}

          {/* Title content */}
          <div className='flex-1 min-w-0'>
            <div className={`text-[11px] font-medium ${isPlaceholder ? 'text-gray-400' : 'text-gray-900'} flex items-center gap-2`}>
              {position && <span className='text-xs font-bold'>{position}.</span>}
              {title}
              {getStatusIcon()}
            </div>
          </div>

          {/* Options menu positioned absolutely - only show if not in viewOnly mode */}
          {!viewOnly && onDelete && node && (
            <div className='absolute top-1 right-1'>
              <NodeOptionsMenu onDelete={onDelete} nodeId={node.id} />
            </div>
          )}
        </div>
      </div>
      {showSourceHandle && (
        <Handle
          type='source'
          position={Position.Bottom}
          className='opacity-0! bottom-0! pointer-events-none!'
          style={{
            bottom: 0,
            left: '50%',
            width: '0px',
            height: '0px',
            transform: 'translateX(-1px)',
            border: 'none',
            borderRadius: 0,
            background: 'transparent',
          }}
        />
      )}
    </div>
  )
}
