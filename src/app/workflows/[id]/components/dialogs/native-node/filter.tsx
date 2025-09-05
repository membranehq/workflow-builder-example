import { FilterNodeData } from '../../types/workflow'
import { cn } from '@/lib/utils'

type FilterProps = FilterNodeData['configuration'] & {
  onChange: (data: FilterNodeData['configuration']) => void
}

// Reusable input components
const TextInput = ({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}) => (
  <input
    type='text'
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={cn(
      'rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2',
      className,
    )}
  />
)

const TextareaInput = ({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
}) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={4}
    className={cn(
      'rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 resize-vertical',
      className,
    )}
  />
)

export const Filter = ({ condition, dataPath, onChange }: FilterProps) => {
  // Ensure all values have defaults to prevent controlled/uncontrolled input warnings
  const safeCondition = condition || ''
  const safeDataPath = dataPath || ''

  return (
    <>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Data Path</label>
        <TextInput
          value={safeDataPath}
          onChange={(e) =>
            onChange({
              condition: safeCondition,
              dataPath: e.target.value,
            })
          }
          placeholder='e.g., data.items or data.users'
          className='w-full'
        />
        <p className='text-xs text-gray-500 dark:text-gray-400'>
          JSONPath expression to access the array of data to filter
        </p>
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Filter Condition</label>
        <TextareaInput
          value={safeCondition}
          onChange={(e) =>
            onChange({
              condition: e.target.value,
              dataPath: safeDataPath,
            })
          }
          placeholder='e.g., item.age > 18 && item.status === "active"'
          className='w-full'
        />
        <p className='text-xs text-gray-500 dark:text-gray-400'>
          JavaScript expression to filter each item. Use &apos;item&apos; to reference the current array element.
        </p>
      </div>
    </>
  )
}
