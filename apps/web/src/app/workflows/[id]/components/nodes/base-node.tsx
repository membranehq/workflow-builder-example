import { Handle, Position } from '@xyflow/react'
import { WorkflowNode } from '../types/workflow'
import { NodeOptionsMenu } from './node-options-menu'

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
}: BaseNodeProps) {
  const isSelected = selected || (node && selectedNodeId === node.id)

  const baseClasses = `
    flex items-center px-3 py-1.5 rounded-md border border-gray-200 bg-white w-[240px] shadow-sm
    transition-all duration-200 ease-in-out
    ${isSelected ? 'shadow-xl ring-2 ring-blue-500 border-blue-500' : ''}
    ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''}
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
            </div>
          </div>

          {/* Options menu positioned absolutely */}
          {onDelete && node && (
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
