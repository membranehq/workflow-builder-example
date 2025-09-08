import { NativeNodeData } from '@/lib/temporal/types'

type NameData = Pick<NativeNodeData, 'name'>

type NameProps = NameData & {
  onChange: ({ name }: NameData) => void
}

export const Name = ({ name, onChange }: NameProps) => {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>Node Name</label>
      <input
        type='text'
        value={name || ''}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder='Enter node name...'
        className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      />
    </div>
  )
}
