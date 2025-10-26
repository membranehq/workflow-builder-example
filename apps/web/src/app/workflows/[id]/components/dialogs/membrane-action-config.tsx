import React from 'react'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Minimizer } from '@/components/ui/minimizer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Action,
  DataInput,
  DataSchema,
  useAction,
  useActions,
  useIntegration,
  useIntegrations,
} from '@membranehq/react'
import Image from 'next/image'
import { WorkflowNode } from '../types/workflow'
import { useIntegrationConnection } from '@/hooks/use-integration-connection'

interface MembraneActionConfigProps {
  value: Omit<WorkflowNode, 'id'>
  onChange: (value: Omit<WorkflowNode, 'id'>) => void
  variableSchema: DataSchema
}

export function MembraneActionConfig({ value, onChange, variableSchema }: MembraneActionConfigProps) {
  const selectedActionId = value.config?.actionId
  const selectedIntegrationKey = value.config?.integrationKey as string

  const { integration: selectedIntegration } = useIntegration(selectedIntegrationKey as string)
  const { integrations } = useIntegrations()

  const { loading: isLoadingSelectedAction, action: selectedActionData } = useAction(selectedActionId as string)

  const actionsForSelectedIntegration = useActions({
    integrationKey: selectedIntegrationKey,
  })

  // Integration connection hook
  const { data: connection, isLoading: isConnectionLoading, isConnecting, connect } = useIntegrationConnection({
    integrationKey: selectedIntegrationKey,
  })

  const isConnected = !!connection

  return (
    <>
      {/* Show selected integration info if we have an integrationKey */}
      {selectedIntegrationKey && selectedIntegration && (
        <div className='space-y-2 pt-4'>
          <Label>App *</Label>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md'>
                {selectedIntegration.logoUri ? (
                  <Image
                    width={20}
                    height={20}
                    src={selectedIntegration.logoUri}
                    alt={`${selectedIntegration.name} logo`}
                    className='w-5 h-5 rounded'
                  />
                ) : (
                  <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                    {selectedIntegration.name[0]}
                  </div>
                )}
                <span className='text-sm font-medium text-gray-900'>{selectedIntegration.name}</span>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='default' size='sm' className="rounded-full">
                  Change
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-80' align='end'>
                <div className='space-y-2'>
                  <div className='text-sm font-medium'>Select an app</div>
                  <div className='grid grid-cols-2 gap-2 max-h-60 overflow-y-auto'>
                    {integrations.slice(0, 20).map((integration) => (
                      <button
                        key={integration.key}
                        onClick={() => {
                          onChange({
                            ...value,
                            config: {
                              ...value.config,
                              integrationKey: integration.key,
                              actionId: undefined,
                              inputMapping: undefined,
                            },
                          })
                        }}
                        className='flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 text-left'
                      >
                        {integration.logoUri ? (
                          <Image
                            width={20}
                            height={20}
                            src={integration.logoUri}
                            alt={`${integration.name} logo`}
                            className='w-5 h-5 rounded'
                          />
                        ) : (
                          <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                            {integration.name[0]}
                          </div>
                        )}
                        <span className='text-sm text-gray-900 truncate'>{integration.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Connection Status Section */}
      {selectedIntegrationKey && selectedIntegration && (
        <div className='space-y-2 pt-4'>
          <Label>Account *</Label>
          {isConnectionLoading ? (
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-5 w-5 rounded' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
          ) : isConnected ? (
            <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2 px-3 py-1 bg-green-100 rounded-md'>
                  {selectedIntegration.logoUri ? (
                    <Image
                      width={20}
                      height={20}
                      src={selectedIntegration.logoUri}
                      alt={`${selectedIntegration.name} logo`}
                      className='w-5 h-5 rounded'
                    />
                  ) : (
                    <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                      {selectedIntegration.name[0]}
                    </div>
                  )}
                  <span className='text-sm font-medium text-green-900'>
                    Connected to {selectedIntegration.name}
                  </span>
                </div>
              </div>
              <Button
                onClick={connect}
                disabled={isConnecting}
                variant='default'
                size='sm'
                className="rounded-full"
              >
                {isConnecting ? 'Reconnecting...' : 'Reconnect'}
              </Button>
            </div>
          ) : (
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md'>
                  {selectedIntegration.logoUri ? (
                    <Image
                      width={20}
                      height={20}
                      src={selectedIntegration.logoUri}
                      alt={`${selectedIntegration.name} logo`}
                      className='w-5 h-5 rounded'
                    />
                  ) : (
                    <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                      {selectedIntegration.name[0]}
                    </div>
                  )}
                  <span className='text-sm font-medium text-gray-900'>
                    Connect {selectedIntegration.name}
                  </span>
                </div>
              </div>
              <Button
                onClick={connect}
                disabled={isConnecting}
                className="bg-primary text-primary-foreground rounded-full"
                size='sm'
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          )}
        </div>
      )}

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
