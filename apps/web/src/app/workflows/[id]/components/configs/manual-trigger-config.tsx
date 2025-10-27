import React from 'react'
import { WorkflowNode } from '../types/workflow'
import { Minimizer } from '@/components/ui/minimizer'
import { SchemaBuilder, JSONSchema } from '@/components/ui/schema-builder'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ManualTriggerConfigProps {
  value: Omit<WorkflowNode, 'id'>
  onChange: (value: Omit<WorkflowNode, 'id'>) => void
}

export function ManualTriggerConfig({ value, onChange }: ManualTriggerConfigProps) {
  const hasInput = value.config?.hasInput !== false // Default to true

  return (
    <div className='space-y-4 pt-4'>
      <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white'>
        <div className='space-y-0.5'>
          <Label htmlFor='has-input' className='text-sm font-medium'>
            Has Input
          </Label>
          <p className='text-xs text-gray-500'>
            Enable to allow input parameters when running this workflow
          </p>
        </div>
        <Switch
          id='has-input'
          checked={hasInput}
          onCheckedChange={(checked) => {
            onChange({
              ...value,
              config: {
                ...value.config,
                hasInput: checked,
              },
            })
          }}
        />
      </div>

      {hasInput && (
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
      )}
    </div>
  )
}

export default ManualTriggerConfig
