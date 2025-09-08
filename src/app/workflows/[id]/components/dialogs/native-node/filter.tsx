import { FilterNodeData } from '@/lib/temporal/types'
import { DataInput } from '@membranehq/react'

type FilterProps = FilterNodeData['configuration'] & {
  onChange: (data: FilterNodeData['configuration']) => void
}

// Filter configuration schema for DataInput
const filterConfigurationSchema = {
  type: 'object',
  properties: {
    dataPath: {
      type: 'string',
      description: 'JSONPath expression to access the array of data to filter',
    },
    condition: {
      type: 'string',
      description: 'JavaScript expression to filter each item. Use "item" to reference the current array element.',
    },
  },
  required: ['dataPath', 'condition'],
}

export const Filter = ({ condition, dataPath, onChange }: FilterProps) => {
  // Convert the current configuration to the format expected by DataInput
  const currentConfig = {
    dataPath: dataPath || '',
    condition: condition || '',
  }

  return (
    <div className='space-y-4'>
      <div className='relative' style={{ isolation: 'isolate' }}>
        <DataInput
          schema={filterConfigurationSchema}
          value={currentConfig}
          variablesSchema={{}}
          onChange={(newConfig) => {
            onChange({
              dataPath: newConfig.dataPath || '',
              condition: newConfig.condition || '',
            })
          }}
        />
      </div>
    </div>
  )
}
