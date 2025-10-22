import React from 'react'
import { DataInput, DataSchema } from '@membranehq/react'
import { WorkflowNode } from '../../types/workflow'
import { TriggerType } from '@/lib/node-types'
import { Minimizer } from '@/components/ui/minimizer'

interface EventTriggerConfigProps {
  value: Omit<WorkflowNode, 'id'>
  onChange: (value: Omit<WorkflowNode, 'id'>) => void
  variableSchema: DataSchema
  triggerTypeConfig: TriggerType
}

export function EventTriggerConfig({ value, onChange, variableSchema, triggerTypeConfig }: EventTriggerConfigProps) {
  return (
    <div className='space-y-2 pt-4'>
      <Minimizer
        title='Event Trigger Configuration'
        defaultOpen={true}
        tooltip='Configure which events should trigger this workflow.'
      >
        <div className='space-y-4'>
          {triggerTypeConfig.configurationSchema && (
            <div
              className='relative z-[1] isolate'
              onFocus={(e) => e.stopPropagation()}
              onBlur={(e) => e.stopPropagation()}
            >
              <DataInput
                schema={triggerTypeConfig.configurationSchema as unknown as DataSchema}
                value={value.config}
                variablesSchema={variableSchema}
                onChange={(configuration) => {
                  onChange({
                    ...value,
                    config: {
                      event: configuration.event,
                    },
                  })
                }}
              />
            </div>
          )}
        </div>
      </Minimizer>
    </div>
  )
}

export default EventTriggerConfig
