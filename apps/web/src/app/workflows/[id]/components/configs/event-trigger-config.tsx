import React, { useEffect, useState } from 'react'
import { DataSchema, useIntegrationApp } from '@membranehq/react'
import { WorkflowNode } from '../types/workflow'
import { TriggerType } from '@/lib/node-types'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Minimizer } from '@/components/ui/minimizer'
import { SelectAppAndConnect } from '@/components/ui/select-app-and-connect'
import { useWorkflow } from '../workflow-context'
import { Copy, Send, CheckCircle2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { getEventIngestUrl } from '@/lib/utils'

interface EventTriggerConfigProps {
  value: Omit<WorkflowNode, 'id'>
  onChange: (value: Omit<WorkflowNode, 'id'>) => void
  variableSchema?: DataSchema
  triggerTypeConfig?: TriggerType
}

interface JsonSchemaProperty {
  type?: string
  properties?: Record<string, JsonSchemaProperty>
  items?: JsonSchemaProperty
  enum?: unknown[]
  example?: unknown
}

interface JsonSchema {
  type?: string
  properties?: Record<string, JsonSchemaProperty>
  items?: JsonSchemaProperty
}

export function EventTriggerConfig({ value, onChange }: EventTriggerConfigProps) {
  const selectedIntegrationKey = value.config?.integrationKey as string
  const selectedDataCollection = value.config?.dataCollection as string
  const selectedEventType = value.config?.eventType as string
  const params = useParams()

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

  // State for output schema
  const [outputSchema, setOutputSchema] = useState<unknown>(null)
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [schemaError, setSchemaError] = useState<string | null>(null)

  // State for sample event sending
  const [isSendingSample, setIsSendingSample] = useState(false)
  const [sampleEventResult, setSampleEventResult] = useState<{ success: boolean; message: string } | null>(null)

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Generate event ingest URL
  const workflowId = workflow?.id || (params.id as string)
  const eventIngestUrl = getEventIngestUrl(workflowId)

  // Generate sample data from JSON schema
  const generateSampleData = (schema: unknown): unknown => {
    if (!schema || typeof schema !== 'object') {
      return {}
    }

    const jsonSchema = schema as JsonSchema

    // Handle different schema types
    if (jsonSchema.type === 'object' && jsonSchema.properties) {
      const sampleData: Record<string, unknown> = {}
      for (const [key, property] of Object.entries(jsonSchema.properties)) {
        sampleData[key] = generateSampleValue(property)
      }
      return sampleData
    } else if (Array.isArray(schema)) {
      // Handle array schemas
      return schema.map(item => generateSampleData(item))
    } else if (jsonSchema.type) {
      return generateSampleValue(jsonSchema)
    }

    return {}
  }

  const generateSampleValue = (property: JsonSchemaProperty): unknown => {
    const type = property.type || 'string'

    switch (type) {
      case 'string':
        if (property.enum && property.enum.length > 0) {
          return property.enum[0]
        }
        return property.example || 'sample_string'
      case 'number':
      case 'integer':
        return property.example || (type === 'integer' ? 42 : 3.14)
      case 'boolean':
        return property.example || true
      case 'array':
        if (property.items) {
          return [generateSampleValue(property.items)]
        }
        return []
      case 'object':
        if (property.properties) {
          const obj: Record<string, unknown> = {}
          for (const [key, prop] of Object.entries(property.properties)) {
            obj[key] = generateSampleValue(prop)
          }
          return obj
        }
        return {}
      default:
        return property.example || 'sample_value'
    }
  }

  // Send sample event
  const sendSampleEvent = async () => {
    if (!outputSchema || !workflowId) {
      setSampleEventResult({ success: false, message: 'No schema available or workflow ID missing' })
      return
    }

    setIsSendingSample(true)
    setSampleEventResult(null)

    try {
      const sampleData = generateSampleData(outputSchema)

      const response = await fetch(getEventIngestUrl(workflowId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleData),
      })

      const result = await response.json()

      if (response.ok) {
        setSampleEventResult({
          success: true,
          message: `Sample event sent successfully! Run ID: ${result.runId}`
        })
      } else {
        setSampleEventResult({
          success: false,
          message: result.error || 'Failed to send sample event'
        })
      }
    } catch (error) {
      console.error('Error sending sample event:', error)
      setSampleEventResult({
        success: false,
        message: 'Network error while sending sample event'
      })
    } finally {
      setIsSendingSample(false)
    }
  }

  // State for connection status from AppConnectionSelector
  const [isConnected, setIsConnected] = useState(false)

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
        const collections = await membrane.connection(selectedIntegrationKey).dataCollection('').get()
        // Transform the collections to match our expected format
        const formattedCollections = Array.isArray(collections)
          ? collections.map((collection: { key?: string; name?: string }) => ({
            key: collection.key || collection.name || '',
            name: collection.name || collection.key || '',
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

  // Fetch output schema when data collection is selected
  useEffect(() => {
    const fetchOutputSchema = async () => {
      if (!isConnected || !selectedIntegrationKey || !selectedDataCollection) {
        setOutputSchema(null)
        return
      }

      setIsLoadingSchema(true)
      setSchemaError(null)

      try {
        const schema = await membrane.connection(selectedIntegrationKey).dataCollection(selectedDataCollection).get()
        setOutputSchema(schema.fieldsSchema)
      } catch (error) {
        console.error('Failed to fetch output schema:', error)
        setSchemaError('Failed to fetch output schema')
        setOutputSchema(null)
      } finally {
        setIsLoadingSchema(false)
      }
    }

    fetchOutputSchema()
  }, [isConnected, selectedIntegrationKey, selectedDataCollection, membrane])

  return (
    <div className='space-y-2 pt-4'>
      {/* Ready Status Indicator - Show if node is ready (set by backend) */}
      {(value as WorkflowNode & { ready?: boolean }).ready && (
        <div className='p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2'>
          <CheckCircle2 className='h-5 w-5 text-green-600' />
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-green-900'>Trigger Configuration Complete</span>
              <Badge className='bg-green-500 hover:bg-green-600 text-white'>Ready</Badge>
            </div>
            <p className='text-xs text-green-700 mt-0.5'>This trigger is ready to activate your workflow.</p>
          </div>
        </div>
      )}

      <div className='space-y-4'>
        {/* App Selection and Connection Section */}
        <SelectAppAndConnect
          selectedIntegrationKey={selectedIntegrationKey}
          onIntegrationChange={(integrationKey) => {
            onChange({
              ...value,
              config: {
                ...value.config,
                integrationKey,
                dataCollection: undefined, // Clear data collection when changing integration
                eventType: undefined, // Clear event type when changing integration
              },
            })
          }}
          onConnectionStateChange={setIsConnected}
        />

        {/* Event Configuration - Only show if connected */}
        {isConnected ? (
          <Minimizer
            title='Event Configuration'
            defaultOpen={true}
            tooltip='Configure which data collection and event type should trigger this workflow.'
          >
            <div className='space-y-4'>
              {/* Data Collection Selection */}
              <div className='space-y-2'>
                <Label required>Data Collection</Label>
                {isLoadingDataCollections ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-10 w-full' />
                  </div>
                ) : dataCollectionError ? (
                  <div className='p-4 border rounded-lg text-sm text-red-600 text-center'>{dataCollectionError}</div>
                ) : dataCollections.length === 0 ? (
                  <div className='p-4 border rounded-lg text-sm text-muted-foreground text-center'>
                    No data collections available for this integration
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <Select
                      value={selectedDataCollection || ''}
                      onValueChange={(dataCollection) => {
                        // Update node name if event type is already selected
                        const dataCollectionName = dataCollections.find((dc) => dc.key === dataCollection)?.name || dataCollection
                        const nodeName = selectedEventType
                          ? `${dataCollectionName}: ${eventTypes.find((et) => et.value === selectedEventType)?.label || selectedEventType}`
                          : value.name

                        onChange({
                          ...value,
                          name: nodeName,
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
                  <Label required>Event Type</Label>
                  <div className='space-y-2'>
                    <Select
                      value={selectedEventType || ''}
                      onValueChange={(eventType) => {
                        // Calculate the node name based on data collection and event type
                        const dataCollectionName = dataCollections.find((dc) => dc.key === selectedDataCollection)?.name || selectedDataCollection
                        const eventTypeLabel = eventTypes.find((et) => et.value === eventType)?.label || eventType
                        const nodeName = `${dataCollectionName}: ${eventTypeLabel}`

                        onChange({
                          ...value,
                          name: nodeName,
                          config: {
                            ...value.config,
                            eventType,
                          },
                        })
                      }}
                    >
                      <SelectTrigger aria-label='Select event type'>
                        <span>
                          {eventTypes.find((et) => et.value === selectedEventType)?.label || 'Select an event type'}
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
        ) : null}

        {/* Output Schema - Show when data collection is selected */}
        {selectedDataCollection && (
          <Minimizer
            title='Output Schema'
            defaultOpen={false}
            tooltip='View the schema of data that will be available when this event triggers.'
          >
            <div className='space-y-2'>
              {isLoadingSchema ? (
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                </div>
              ) : schemaError ? (
                <div className='p-4 border rounded-lg text-sm text-red-600 text-center'>{schemaError}</div>
              ) : outputSchema ? (
                <div className='p-3 bg-gray-50 rounded-md border'>
                  <pre className='text-xs text-foreground overflow-auto max-h-60'>
                    {JSON.stringify(outputSchema, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className='p-4 border rounded-lg text-sm text-muted-foreground text-center'>
                  No schema available for this data collection
                </div>
              )}
            </div>
          </Minimizer>
        )}

        {/* Event Ingest URL - Always show at the end */}
        <div className='space-y-2'>
          <Label>Event Ingest URL</Label>
          <div className='p-2 bg-gray-50 text-muted-foreground rounded-md border min-h-[40px] flex items-center justify-between'>
            <div className='flex-1 truncate pr-2'>{eventIngestUrl || 'Event ingest URL will appear here...'}</div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => copyToClipboard(eventIngestUrl)}
              disabled={!eventIngestUrl}
              className='p-1 h-8 w-8 flex-shrink-0 rounded-full'
            >
              <Copy className='h-4 w-4' />
            </Button>
          </div>

          {outputSchema !== null && (
            <div className='space-y-2'>
              <Button
                onClick={sendSampleEvent}
                disabled={isSendingSample || !workflowId}
                className='rounded-full'
                variant='outline'
              >
                <Send className='h-4 w-4 mr-2' />
                {isSendingSample ? 'Sending Sample Event...' : 'Send Sample Event'}
              </Button>

              {sampleEventResult && (
                <div className={`p-3 rounded-md border text-sm ${sampleEventResult.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                  {sampleEventResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventTriggerConfig
