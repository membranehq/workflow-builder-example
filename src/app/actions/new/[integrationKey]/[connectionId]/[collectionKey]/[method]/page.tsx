'use client'

import { useIntegrationApp, DataInput } from '@membranehq/react'
import { Button } from '@/components/ui/button'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import '@membranehq/react/styles.css'
import { TestResultDialog } from '@/app/actions/components/test-result-dialog'

interface Connection {
  id: string
  name: string
  integration?: {
    key?: string
    name?: string
    logoUri?: string
  }
}

interface CollectionSpec {
  name: string
  fieldsSchema?: Record<string, unknown>
  parametersSchema?: Record<string, unknown>
}

const METHODS = {
  list: {
    inputSchema: {
      type: 'object',
      properties: {
        cursor: {
          type: 'string',
        },
      },
    },
  },
  create: {
    inputSchema: {
      type: 'object',
      properties: {
        fields: {}, // Will be populated with collection fields schema
      },
    },
  },
  update: {
    inputSchema: {
      type: 'object',
      properties: {
        fields: {}, // Will be populated with collection fields schema
      },
    },
  },
  delete: {
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
  },
  search: {
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        cursor: { type: 'string' },
      },
    },
  },
  'find-by-id': {
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
  },
}

export default function ConfigureMethodPage() {
  const router = useRouter()
  const { integrationKey, connectionId, collectionKey, method } = useParams()
  const integrationApp = useIntegrationApp()
  const [collectionSpec, setCollectionSpec] = useState<CollectionSpec | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState<Record<string, unknown>>({})
  const [parameters, setParameters] = useState<Record<string, unknown>>({})
  const [testResult, setTestResult] = useState<unknown>(null)
  const [testError, setTestError] = useState<Error | unknown>(null)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)

  const fetchCollectionSpec = useCallback(async () => {
    try {
      setIsLoading(true)
      const [spec, conn] = await Promise.all([
        integrationApp.integration(integrationKey as string).getDataCollection(collectionKey as string),
        integrationApp.connection(connectionId as string).get(),
      ])
      setCollectionSpec(spec)
      setConnection(conn)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [integrationApp, integrationKey, collectionKey, connectionId])

  useEffect(() => {
    fetchCollectionSpec()
  }, [fetchCollectionSpec])

  const handleParametersChange = (newParameters: Record<string, unknown>) => {
    setParameters(newParameters)
  }

  const getMethodSchema = () => {
    const methodSpec = METHODS[method as keyof typeof METHODS]
    if (method === 'create' || method === 'update') {
      return {
        ...methodSpec.inputSchema,
        properties: {
          ...methodSpec.inputSchema.properties,
          fields: collectionSpec?.fieldsSchema || {},
        },
      }
    }
    return methodSpec.inputSchema
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId,
          collectionKey,
          method,
          input: inputValue,
          parameters,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save action')
      }

      router.push('/actions')
    } catch (error) {
      console.error('Failed to save action:', error)
      // You might want to show an error toast here
    }
  }

  const handleTest = async () => {
    try {
      const connection = integrationApp.connection(connectionId as string)
      const dataCollection = connection.dataCollection(collectionKey as string)

      // Type assertion to handle method as a key
      const methodFn = dataCollection[method as keyof typeof dataCollection] as (...args: unknown[]) => Promise<unknown>
      if (typeof methodFn !== 'function') {
        throw new Error(`Method ${method} not found`)
      }

      const response = await methodFn(inputValue)

      setTestResult(response)
      setIsTestDialogOpen(true)
    } catch (error) {
      console.error('Test failed:', error)
      setTestError(error)
      setIsTestDialogOpen(true)
    }
  }

  if (isLoading) {
    return (
      <div className='px-4 py-6 sm:px-0'>
        <div className='flex items-center space-x-4'>
          <div className='w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse' />
          <div className='space-y-2'>
            <div className='h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
            <div className='h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='px-4 py-6 sm:px-0'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-3'>
              {connection?.integration?.logoUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={connection.integration.logoUri}
                  alt={`${connection.integration.name || 'Integration'} logo`}
                  className='w-10 h-10 rounded-lg'
                />
              ) : (
                <div className='w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-medium text-gray-600 dark:text-gray-300'>
                  {connection?.integration?.name?.[0] || connection?.name?.[0] || '?'}
                </div>
              )}
              <div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>{connection?.name}</div>
                <div className='flex items-center space-x-2 text-gray-900 dark:text-white'>
                  <span className='font-medium'>{collectionSpec?.name}</span>
                  <span className='text-gray-400'>/</span>
                  <span className='font-medium'>{method}</span>
                </div>
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='ghost' onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={handleSave}>Save Action</Button>
            <Button variant='outline' onClick={handleTest}>
              Test Run
            </Button>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
          {isLoading ? (
            <div className='space-y-4'>
              <div className='h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
            </div>
          ) : (
            <div className='space-y-4'>
              <h2 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Input Configuration</h2>
              <div className='relative'>
                {collectionSpec?.parametersSchema ? (
                  <>
                    <div className='mb-4'>
                      <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Parameters</h3>
                      <DataInput
                        schema={collectionSpec?.parametersSchema}
                        value={parameters}
                        variablesSchema={{}}
                        onChange={handleParametersChange}
                      />
                    </div>
                  </>
                ) : (
                  <></>
                )}
                Input:
                <DataInput
                  schema={getMethodSchema()}
                  value={inputValue}
                  variablesSchema={{}}
                  onChange={setInputValue}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <TestResultDialog
        isOpen={isTestDialogOpen}
        onClose={() => {
          setIsTestDialogOpen(false)
          setTestResult(null)
          setTestError(null)
        }}
        result={testResult}
        error={testError}
      />
    </>
  )
}
