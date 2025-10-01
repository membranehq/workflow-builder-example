import { Handle, Position } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { WorkflowNode } from '../types/workflow'
import { X } from 'lucide-react'
import { ReactNode } from 'react'

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
}: BaseNodeProps) {
  const baseClasses = `
    flex items-center p-4 rounded-lg border-2 bg-white w-[240px] h-[48px]
    ${selected ? 'border-blue-500' : 'border-gray-200'}
    ${onClick ? 'cursor-pointer hover:border-gray-400' : ''}
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
      {onDelete && node && (
        <Button
          variant='ghost'
          size='icon'
          className='absolute -top-2 -right-2 h-4 w-4 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-500 z-10 [&_svg]:!h-2 [&_svg]:!w-2'
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.id)
          }}
        >
          <X />
        </Button>
      )}
      <div className={baseClasses} onClick={onClick}>
        <div className='flex items-center gap-3'>
          <div className='shrink-0 bg-muted rounded-md p-1'>{icon}</div>
          <div className='grow'>
            <div className='text-[11px] font-medium text-gray-900'>{title}</div>
            {subtitle && <div className='text-[10px] text-gray-500'>{subtitle}</div>}
          </div>
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
