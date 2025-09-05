import { WorkflowNode } from '@/lib/temporal/types'

type NameData = Pick<WorkflowNode, 'name'>

type NameProps = NameData & {
  onChange: ({ name }: NameData) => void
}

export const Name = ({ name, onChange }: NameProps) => {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Name</label>
      <input
        type='text'
        value={name}
        onChange={(e) => onChange({ name: e.target.value })}
        className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2'
      />
    </div>
  )
}
