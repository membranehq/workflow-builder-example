import { useNodeTypes } from '@/hooks/use-action-types'
import { NativeNodeData } from '@/lib/temporal/types'

type TypeData = Pick<NativeNodeData, 'type'>

type NodeTypeSelectorProps = TypeData & { onChange: ({ type }: TypeData) => void }

export const NodeTypeSelector = ({ type, onChange }: NodeTypeSelectorProps) => {
  const { nodeTypes, isLoading } = useNodeTypes()

  if (isLoading) {
    return (
      <div className='space-y-2'>
        <div className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 px-3 py-2 animate-pulse'>
          Loading node types...
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>Node Type</label>
      <select
        value={type || ''}
        onChange={(e) => onChange({ type: e.target.value as NativeNodeData['type'] })}
        className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      >
        <option value=''>Select a node type...</option>
        {nodeTypes.map((nodeType) => (
          <option key={nodeType.type} value={nodeType.type}>
            {nodeType.icon} {nodeType.name}
          </option>
        ))}
      </select>
    </div>
  )
}
