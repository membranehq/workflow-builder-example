import { Handle, Position } from '@xyflow/react'
import { WorkflowNode } from '../types/workflow'
import { ReactNode } from 'react'
import { NodeOptionsMenu } from './node-options-menu'

interface BaseNodeProps {
  selected?: boolean
  icon: ReactNode | null
  title: string
  subtitle?: string
  node?: WorkflowNode
  onDelete?: (nodeId: string) => void
  onClick?: () => void
  showSourceHandle?: boolean
  showTargetHandle?: boolean
  className?: string
  position?: number
  selectedNodeId?: string | null
}

export function BaseNode({
  selected,
  icon,
  title,
  subtitle,
  node,
  onDelete,
  onClick,
  showSourceHandle = true,
  showTargetHandle = true,
  className = '',
  position,
  selectedNodeId,
}: BaseNodeProps) {
  const isSelected = selected || (node && selectedNodeId === node.id)

  const baseClasses = `
    flex items-center p-2 rounded-md border border-gray-200 bg-white w-[240px] h-[48px] shadow-sm
    transition-all duration-200 ease-in-out
    ${isSelected ? 'shadow-md ring-2 ring-blue-500 border-blue-500' : ''}
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
        <div className='flex items-center gap-3 w-full justify-between'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            <div className='shrink-0 bg-muted rounded-md p-1'>{icon}</div>
            <div className='flex-1 min-w-0'>
              <div className='text-[11px] font-medium text-gray-900 flex items-center gap-2'>
                {position && (
                  <span className='text-xs font-medium'>
                    {position}.
                  </span>
                )}
                {title}
              </div>
              {subtitle && <div className='text-[10px] text-gray-500'>{subtitle}</div>}
            </div>
          </div>
          {onDelete && node && (
            <NodeOptionsMenu
              onDelete={onDelete}
              nodeId={node.id}
            />
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
