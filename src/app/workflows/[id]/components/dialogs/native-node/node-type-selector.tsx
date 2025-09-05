import { WorkflowNode } from '@/lib/temporal/types'

type NodeType = Pick<WorkflowNode, 'type'>
type NodeTypeSelectorProps = NodeType & { onChange: ({ type }: NodeType) => void }

const nodeTypes: NodeType['type'][] = ['http', 'condition', 'trigger', 'transform']

export const NodeTypeSelector = ({ type, onChange }: NodeTypeSelectorProps) => {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Node type</label>
      <select
        value={type}
        onChange={(e) => onChange({ type: e.target.value as NodeType['type'] })}
        className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2'
      >
        <option key='not-selected' value=''>
          ---
        </option>
        {nodeTypes.map((nodeType) => (
          <option key={nodeType} value={nodeType}>
            {nodeType}
          </option>
        ))}
      </select>
    </div>
  )
}
