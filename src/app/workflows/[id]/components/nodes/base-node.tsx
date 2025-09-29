import { Handle, Position } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { WorkflowNode } from '../types/workflow'
import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface BaseNodeProps {
  selected?: boolean
  icon: ReactNode
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
    flex items-center p-4 rounded-lg border-2 bg-white w-[400px] h-[80px]
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
            width: '1px',
            height: '1px',
            transform: 'none',
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
          className='absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-500 z-10'
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.id)
          }}
        >
          <X className='h-2.5 w-2.5' />
        </Button>
      )}
      <div className={baseClasses} onClick={onClick}>
        <div className='flex items-center gap-3'>
          <div className='shrink-0 bg-muted rounded-md p-2'>{icon}</div>
          <div className='grow'>
            <div className='text-sm font-medium text-gray-900'>{title}</div>
            {subtitle && <div className='text-sm text-gray-500'>{subtitle}</div>}
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
            width: '1px',
            height: '1px',
            transform: 'none',
            border: 'none',
            borderRadius: 0,
            background: 'transparent',
          }}
        />
      )}
    </div>
  )
}
