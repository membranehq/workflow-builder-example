import React, { useEffect, useState } from 'react'
import { DataSchema, useIntegration, useIntegrations, useIntegrationApp } from '@membranehq/react'
import { WorkflowNode } from '../../types/workflow'
import { TriggerType } from '@/lib/node-types'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Minimizer } from '@/components/ui/minimizer'
import Image from 'next/image'
import { useIntegrationConnection } from '@/hooks/use-integration-connection'
import { useWorkflow } from '../../workflow-context'
import { Copy } from 'lucide-react'
import { useParams } from 'next/navigation'

interface EventTriggerConfigProps {
  value: Omit<WorkflowNode, 'id'>
  onChange: (value: Omit<WorkflowNode, 'id'>) => void
  variableSchema?: DataSchema
  triggerTypeConfig?: TriggerType
}

export function EventTriggerConfig({ value, onChange }: EventTriggerConfigProps) {
  const selectedIntegrationKey = value.config?.integrationKey as string
  const selectedDataCollection = value.config?.dataCollection as string
  const selectedEventType = value.config?.eventType as string
  const params = useParams()

  const { integration: selectedIntegration } = useIntegration(selectedIntegrationKey as string)
  const { integrations } = useIntegrations()
  const { workflow } = useWorkflow()

  const membrane = useIntegrationApp()

  // Event type options
  const eventTypes = [
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
  ]

  // State for data collections
  const [dataCollections, setDataCollections] = useState<Array<{ key: string; name: string }>>([])
  const [isLoadingDataCollections, setIsLoadingDataCollections] = useState(false)
  const [dataCollectionError, setDataCollectionError] = useState<string | null>(null)

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Generate event ingest URL
  const workflowId = workflow?.id || params.id as string
  const eventIngestUrl = workflowId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/inngest/${workflowId}`
    : ''

  // Debug logging
  console.log('EventTriggerConfig Debug:', {
    workflowId,
    workflow: workflow?.id,
    paramsId: params.id,
    eventIngestUrl,
    windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'undefined'
  })

  // Integration connection hook
  const {
    data: connection,
    isLoading: isConnectionLoading,
    isConnecting,
    connect,
  } = useIntegrationConnection({
    integrationKey: selectedIntegrationKey,
  })

  const isConnected = !!connection

  // Fetch data collections when connected
  useEffect(() => {
    const fetchDataCollections = async () => {
      if (!isConnected || !selectedIntegrationKey) {
        setDataCollections([])
        return
      }

      setIsLoadingDataCollections(true)
      setDataCollectionError(null)

      try {
        const collections = await membrane.connection(selectedIntegrationKey).dataCollection("").get()
        // Transform the collections to match our expected format
        const formattedCollections = Array.isArray(collections)
          ? collections.map((collection: { key?: string; name?: string }) => ({
            key: collection.key || collection.name || '',
            name: collection.name || collection.key || ''
          }))
          : []
        setDataCollections(formattedCollections)
      } catch (error) {
        console.error('Failed to fetch data collections:', error)
        setDataCollectionError('Failed to fetch data collections')
        setDataCollections([])
      } finally {
        setIsLoadingDataCollections(false)
      }
    }

    fetchDataCollections()
  }, [isConnected, selectedIntegrationKey, membrane])

  return (
    <div className='space-y-2 pt-4'>
      <div className='space-y-4'>
        {/* App Selection Section */}
        {selectedIntegrationKey && selectedIntegration ? (
          <div className='space-y-2'>
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
                  <Button variant='default' size='sm'>
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
                                dataCollection: undefined, // Clear data collection when changing integration
                                eventType: undefined, // Clear event type when changing integration
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
        ) : (
          <div className='space-y-2'>
            <Label>App *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='w-full justify-start'>
                  Select an app
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-80' align='start'>
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
                              dataCollection: undefined, // Clear data collection when changing integration
                              eventType: undefined, // Clear event type when changing integration
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
        )}

        {/* Connection Status Section */}
        {selectedIntegrationKey && selectedIntegration && (
          <div className='space-y-2'>
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
                    <span className='text-sm font-medium text-green-900'>Connected to {selectedIntegration.name}</span>
                  </div>
                </div>
                <Button onClick={connect} disabled={isConnecting} variant='default' size='sm'>
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
                    <span className='text-sm font-medium text-gray-900'>Connect {selectedIntegration.name}</span>
                  </div>
                </div>
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  className='bg-primary text-primary-foreground'
                  size='sm'
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Event Configuration - Only show if connected */}
        {isConnected && (
          <Minimizer
            title='Event Configuration'
            defaultOpen={true}
            tooltip='Configure which data collection and event type should trigger this workflow.'
          >
            <div className='space-y-4'>
              {/* Data Collection Selection */}
              <div className='space-y-2'>
                <Label>Data Collection *</Label>
                {isLoadingDataCollections ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-10 w-full' />
                  </div>
                ) : dataCollectionError ? (
                  <div className='p-4 border rounded-lg text-sm text-red-600 text-center'>
                    {dataCollectionError}
                  </div>
                ) : dataCollections.length === 0 ? (
                  <div className='p-4 border rounded-lg text-sm text-muted-foreground text-center'>
                    No data collections available for this integration
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <Select
                      value={selectedDataCollection || ''}
                      onValueChange={(dataCollection) => {
                        onChange({
                          ...value,
                          config: {
                            ...value.config,
                            dataCollection,
                            eventType: undefined, // Clear event type when changing data collection
                          },
                        })
                      }}
                    >
                      <SelectTrigger aria-label='Select data collection'>
                        <span>
                          {dataCollections.find((dc) => dc.key === selectedDataCollection)?.name ||
                            'Select a data collection'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {dataCollections.map((collection) => (
                          <SelectItem key={collection.key} value={collection.key}>
                            <span>{collection.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Event Type Selection - Only show if data collection selected */}
              {selectedDataCollection && (
                <div className='space-y-2'>
                  <Label>Event Type *</Label>
                  <div className='space-y-2'>
                    <Select
                      value={selectedEventType || ''}
                      onValueChange={(eventType) => {
                        onChange({
                          ...value,
                          config: {
                            ...value.config,
                            eventType,
                          },
                        })
                      }}
                    >
                      <SelectTrigger aria-label='Select event type'>
                        <span>
                          {eventTypes.find((et) => et.value === selectedEventType)?.label ||
                            'Select an event type'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((eventType) => (
                          <SelectItem key={eventType.value} value={eventType.value}>
                            <span>{eventType.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </Minimizer>
        )}

        {/* Event Ingest URL - Always show at the end */}
        <div className='space-y-2'>
          <Label>Event Ingest URL</Label>
          <div className='p-3 bg-gray-50 text-gray-700 rounded-md border min-h-[40px] flex items-center justify-between'>
            <div className='flex-1 truncate pr-2'>
              {eventIngestUrl || 'Event ingest URL will appear here...'}
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => copyToClipboard(eventIngestUrl)}
              disabled={!eventIngestUrl}
              className='p-1 h-8 w-8 flex-shrink-0'
            >
              <Copy className='h-4 w-4' />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EventTriggerConfig
