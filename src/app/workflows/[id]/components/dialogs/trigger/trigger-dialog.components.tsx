import { Input } from '@/components/ui/input'
import { DataInput, Connection, Flow } from '@membranehq/react'
import { DataSchema } from '@membranehq/sdk'
import { getIntegrationName } from '../../utils'
import { type State } from './trigger-dialog.reducer'

interface TriggerNameInputProps {
  name: string
  onNameChange: (name: string) => void
}

export function TriggerNameInput({ name, onNameChange }: TriggerNameInputProps) {
  return (
    <div className='grid gap-2'>
      <label htmlFor='name' className='text-sm font-medium'>
        Name
      </label>
      <Input id='name' value={name} onChange={(e) => onNameChange(e.target.value)} placeholder='Enter trigger name' />
    </div>
  )
}

interface IntegrationSelectorProps {
  connections: Connection[]
  selectedConnectionId?: string
  onIntegrationChange: (connectionId: string) => void
}

export function IntegrationSelector({
  connections,
  selectedConnectionId,
  onIntegrationChange,
}: IntegrationSelectorProps) {
  return (
    <div className='grid gap-2'>
      <label htmlFor='integration' className='text-sm font-medium'>
        Integration
      </label>
      <select
        id='integration'
        value={selectedConnectionId || ''}
        onChange={(e) => onIntegrationChange(e.target.value)}
        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
      >
        <option value=''>Select integration</option>
        {connections?.map((connection) => (
          <option key={connection.id} value={connection.id}>
            {getIntegrationName(connection)}
          </option>
        ))}
      </select>
    </div>
  )
}

interface FlowSelectorProps {
  flows: Flow[]
  selectedFlowKey?: string
  onFlowChange: (flowKey: string) => void
}

export function FlowSelector({ flows, selectedFlowKey, onFlowChange }: FlowSelectorProps) {
  return (
    <div className='grid gap-2'>
      <label htmlFor='trigger' className='text-sm font-medium'>
        Trigger
      </label>
      <select
        id='trigger'
        value={selectedFlowKey || ''}
        onChange={(e) => onFlowChange(e.target.value)}
        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
      >
        <option value=''>Select trigger</option>
        {flows.map((flow) => (
          <option key={flow.key} value={flow.key}>
            {flow.name || flow.key}
          </option>
        ))}
      </select>
    </div>
  )
}

interface ParametersConfigProps {
  flow: Flow
  parameters: Record<string, unknown>
  onParametersChange: (parameters: Record<string, unknown>) => void
}

export function ParametersConfig({ flow, parameters, onParametersChange }: ParametersConfigProps) {
  // Helper function to ensure schema is properly formatted
  const getFormattedSchema = (schema: DataSchema): DataSchema => {
    if (!schema) return schema

    // If schema is an array, wrap it in an object
    if (Array.isArray(schema)) {
      return {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: schema[0],
          },
        },
      }
    }

    // If schema is already an object, return as is
    if (typeof schema === 'object' && schema !== null) {
      return schema
    }

    // If schema is a primitive type, wrap it in an object
    return {
      type: 'object',
      properties: {
        value: {
          type:
            typeof schema === 'string'
              ? 'string'
              : typeof schema === 'number'
                ? 'number'
                : typeof schema === 'boolean'
                  ? 'boolean'
                  : 'string',
        },
      },
    }
  }

  return (
    <div className='grid gap-2'>
      <label htmlFor='parameters' className='text-sm font-medium'>
        Configure Parameters
      </label>
      <DataInput
        schema={getFormattedSchema(flow.parametersSchema as DataSchema)}
        value={parameters}
        onChange={onParametersChange}
      />
    </div>
  )
}

interface TriggerFormProps {
  state: State
  connections: Connection[]
  onNameChange: (name: string) => void
  onIntegrationChange: (connectionId: string) => void
  onFlowChange: (flowKey: string) => void
  onParametersChange: (parameters: Record<string, unknown>) => void
}

export function TriggerForm({
  state,
  connections,
  onNameChange,
  onIntegrationChange,
  onFlowChange,
  onParametersChange,
}: TriggerFormProps) {
  return (
    <div className='grid gap-4'>
      <TriggerNameInput name={state.name} onNameChange={onNameChange} />

      <IntegrationSelector
        connections={connections}
        selectedConnectionId={state.connection?.id}
        onIntegrationChange={onIntegrationChange}
      />

      {state.connection && (
        <>
          <FlowSelector flows={state.flows} selectedFlowKey={state.flow?.key} onFlowChange={onFlowChange} />

          {state.flow && (
            <ParametersConfig flow={state.flow} parameters={state.parameters} onParametersChange={onParametersChange} />
          )}
        </>
      )}
    </div>
  )
}
