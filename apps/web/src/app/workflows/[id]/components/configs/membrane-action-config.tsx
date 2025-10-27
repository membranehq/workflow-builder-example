import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Minimizer } from '@/components/ui/minimizer'
import { SelectAppAndConnect } from '@/components/ui/select-app-and-connect'
import {
  Action,
  DataInput,
  DataSchema,
  useAction,
  useActions,
} from '@membranehq/react'
import Image from 'next/image'
import { WorkflowNode } from '../types/workflow'

interface MembraneActionConfigProps {
  value: Omit<WorkflowNode, 'id'>
  onChange: (value: Omit<WorkflowNode, 'id'>) => void
  variableSchema: DataSchema
}

export function MembraneActionConfig({ value, onChange, variableSchema }: MembraneActionConfigProps) {
  const selectedActionId = value.config?.actionId
  const selectedIntegrationKey = value.config?.integrationKey as string

  // State for connection status from AppConnectionSelector
  const [isConnected, setIsConnected] = useState(false)

  const { loading: isLoadingSelectedAction, action: selectedActionData } = useAction(selectedActionId as string)

  const actionsForSelectedIntegration = useActions({
    integrationKey: selectedIntegrationKey,
  })

  return (
    <>
      {/* App Selection and Connection Section */}
      <SelectAppAndConnect
        selectedIntegrationKey={selectedIntegrationKey}
        onIntegrationChange={(integrationKey) => {
          onChange({
            ...value,
            config: {
              ...value.config,
              integrationKey,
              actionId: undefined,
              inputMapping: undefined,
            },
          })
        }}
        onConnectionStateChange={setIsConnected}
      />

      {/* Only show actions if user is connected */}
      {isConnected && (
        <div className='space-y-2 pt-4'>
          <Label>Select an action</Label>
          {actionsForSelectedIntegration.loading ? (
            <div className='space-y-2'>
              <Skeleton className='h-10 w-full' />
            </div>
          ) : actionsForSelectedIntegration.items.length === 0 ? (
            <div className='p-4 border rounded-lg text-sm text-muted-foreground text-center'>
              There are no actions available for this integration
            </div>
          ) : (
            <div className='space-y-2'>
              <Select
                value={selectedActionId as string}
                onValueChange={(actionId) => {
                  onChange({ ...value, config: { ...value.config, actionId } })
                }}
              >
                <SelectTrigger aria-label='Select action'>
                  <div className='flex items-center gap-2'>
                    {(() => {
                      const selectedActionData = actionsForSelectedIntegration.items.find(
                        (a: Action) => a.id === selectedActionId,
                      )
                      return selectedActionData?.integration?.logoUri ? (
                        <Image
                          width={16}
                          height={16}
                          src={selectedActionData.integration.logoUri}
                          alt='Integration logo'
                          className='w-4 h-4 rounded'
                        />
                      ) : null
                    })()}
                    <span>
                      {actionsForSelectedIntegration.items.find((a: Action) => a.id === selectedActionId)?.name ||
                        'Select an action'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {actionsForSelectedIntegration.items.map((action) => (
                    <SelectItem key={action.id} value={action.id}>
                      <div className='flex items-center gap-2'>
                        {action.integration?.logoUri ? (
                          <Image
                            width={16}
                            height={16}
                            src={action.integration.logoUri}
                            alt='Integration logo'
                            className='w-4 h-4 rounded'
                          />
                        ) : null}
                        <span>{action.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Only show action configuration if user is connected */}
      {isConnected && (
        <div className='space-y-2 pt-4'>
          {!selectedActionId ? (
            /* Show placeholder when no action is selected */
            actionsForSelectedIntegration.items.length > 0 ? (
              <div className='text-sm text-muted-foreground'>Select an action above to configure it</div>
            ) : null
          ) : isLoadingSelectedAction ? (
            /* Show compact skeleton while loading selected action */
            <div className='space-y-3'>
              <Skeleton className='h-5 w-44' />
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-5 w-36 mt-2' />
              <Skeleton className='h-16 w-full' />
            </div>
          ) : selectedActionData ? (
            /* Show actual content when loaded */
            <>
              {selectedActionData?.inputSchema && (
                <Minimizer title='Configure Action Input' defaultOpen={true}>
                  <DataInput
                    schema={selectedActionData?.inputSchema}
                    value={value.config?.inputMapping}
                    variablesSchema={variableSchema}
                    onChange={(configuration) => {
                      onChange({ ...value, config: { ...value.config, inputMapping: configuration } })
                    }}
                  />
                </Minimizer>
              )}

              <Minimizer title='Output Schema' defaultOpen={false} className='mt-4'>
                <div className='h-40 overflow-y-auto border rounded-md p-2 w-full'>
                  <pre className='text-xs'>{JSON.stringify(selectedActionData?.outputSchema, null, 2)}</pre>
                </div>
              </Minimizer>
            </>
          ) : (
            /* Show error state */
            <div className='text-sm text-muted-foreground'>Failed to load action details</div>
          )}
        </div>
      )}
    </>
  )
}

export default MembraneActionConfig
