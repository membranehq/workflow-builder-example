import React from 'react'
import { WorkflowNode } from '../../types/workflow'
import { Minimizer } from '@/components/ui/minimizer'
import { SchemaBuilder, JSONSchema } from '@/components/ui/schema-builder'

interface ManualTriggerConfigProps {
  value: Omit<WorkflowNode, 'id'>
  onChange: (value: Omit<WorkflowNode, 'id'>) => void
}

export function ManualTriggerConfig({ value, onChange }: ManualTriggerConfigProps) {
  return (
    <div className='space-y-2 border-t pt-4'>
      <Minimizer title='Input Schema' defaultOpen={true} tooltip="Configure Input Schema for this trigger">
        <div className='space-y-4'>
          <SchemaBuilder
            value={value.config?.inputSchema as JSONSchema}
            onChange={(schema) => {
              onChange({
                ...value,
                config: {
                  ...value.config,
                  inputSchema: schema,
                },
              })
            }}
          />
        </div>
      </Minimizer>
    </div>
  )
}

export default ManualTriggerConfig
