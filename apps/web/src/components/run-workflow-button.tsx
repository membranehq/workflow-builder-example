'use client'

import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DataInput, DataSchema } from '@membranehq/react'
import { Play } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetch-utils'
import { jsonSchemaToZod } from '@/lib/json-schema-to-zod'
import { z } from 'zod'

interface RunWorkflowButtonProps {
  workflowId: string
  workflowStatus?: 'active' | 'inactive'
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  showLabel?: boolean
  navigateToRun?: boolean
  onRunStart?: () => void
  onRunComplete?: (runId: string) => void
  onRunError?: (error: Error) => void
}

interface WorkflowData {
  _id: string
  name: string
  status: 'active' | 'inactive'
  nodes: Array<{
    id: string
    name: string
    type: string
    triggerType?: string
    config?: {
      hasInput?: boolean
      inputSchema?: DataSchema
    }
  }>
}

export function RunWorkflowButton({
  workflowId,
  workflowStatus,
  size = 'sm',
  variant = 'default',
  className = '',
  showLabel = true,
  navigateToRun = true,
  onRunStart,
  onRunComplete,
  onRunError,
}: RunWorkflowButtonProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [triggerInput, setTriggerInput] = useState<Record<string, unknown>>({})
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isValid, setIsValid] = useState(true)

  // Fetch workflow data to get the input schema
  const { data: workflow } = useSWR<WorkflowData>(`/api/workflows/${workflowId}`, fetcher, {
    revalidateOnFocus: false,
  })

  // Determine if the first node is a manual trigger
  const isFirstNodeManualTrigger = useMemo(() => {
    if (!workflow?.nodes || workflow.nodes.length === 0) return false
    const firstNode = workflow.nodes[0]
    return firstNode.type === 'trigger' && firstNode.triggerType === 'manual'
  }, [workflow?.nodes])

  // Get the first node (trigger) and its input schema
  const firstNode = useMemo(() => {
    if (!workflow?.nodes || workflow.nodes.length === 0) return null
    return workflow.nodes[0]
  }, [workflow?.nodes])

  const hasInput = useMemo(() => {
    if (!firstNode) return false
    return firstNode.config?.hasInput !== false // Default to true for backward compatibility
  }, [firstNode])

  const triggerInputSchema = useMemo((): DataSchema | null => {
    if (!firstNode || firstNode.type !== 'trigger') return null
    return firstNode.config?.inputSchema || { type: 'object', properties: {} }
  }, [firstNode])

  // Create Zod schema from JSON schema
  const zodSchema = useMemo(() => {
    if (!triggerInputSchema) return null
    try {
      return jsonSchemaToZod(triggerInputSchema)
    } catch (error) {
      console.error('Failed to create Zod schema:', error)
      return null
    }
  }, [triggerInputSchema])

  // Validate input whenever it changes
  useEffect(() => {
    if (!zodSchema) {
      setIsValid(true)
      setValidationErrors({})
      return
    }

    try {
      zodSchema.parse(triggerInput)
      setIsValid(true)
      setValidationErrors({})
    } catch (error) {
      if (error instanceof z.ZodError) {
        setIsValid(false)
        const errors: Record<string, string> = {}
        error.issues.forEach((err) => {
          const path = err.path.join('.')
          errors[path] = err.message
        })
        setValidationErrors(errors)
      } else {
        setIsValid(false)
        setValidationErrors({})
      }
    }
  }, [triggerInput, zodSchema])

  const handleRunWorkflow = async () => {
    try {
      // Close popover immediately when button is clicked
      setPopoverOpen(false)
      setIsRunning(true)
      onRunStart?.()

      const response = await axios.post<{ runId: string }>(
        `/api/workflows/${workflowId}/run`,
        { input: triggerInput }
      )

      onRunComplete?.(response.data.runId)

      // Navigate to the specific run page only if navigateToRun is true
      if (navigateToRun) {
        router.push(`/runs/${response.data.runId}`)
      }
    } catch (error) {
      console.error('Failed to run workflow:', error)
      onRunError?.(error as Error)
    } finally {
      setIsRunning(false)
    }
  }

  // Use workflowStatus from props or from fetched workflow data
  const status = workflowStatus || workflow?.status
  const isDisabled = isRunning || !isFirstNodeManualTrigger || status !== 'active'
  const isRunButtonDisabled = isDisabled || (hasInput && !isValid)

  // If we need to show inputs, use a Popover
  if (hasInput) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size={size}
            variant={variant}
            disabled={isDisabled}
            className={`rounded-full ${className}`}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <Play className={`h-4 w-4 ${showLabel ? 'mr-1.5' : ''}`} />
            {showLabel && 'Run'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-96' align='end' side='bottom' onClick={(e) => e.stopPropagation()}>
          <div className='space-y-6'>
            {/* Header */}
            <div className='border-b border-gray-100 pb-3'>
              <div className='flex items-center gap-2'>
                <Play className='h-4 w-4 text-green-600' />
                <h3 className='font-semibold text-sm text-gray-900'>Run Workflow</h3>
              </div>

            </div>

            {/* Content */}
            {triggerInputSchema &&
              triggerInputSchema.properties &&
              Object.keys(triggerInputSchema.properties).length > 0 ? (
              <div className='space-y-4'>
                <div>
                  <h4 className='text-sm font-medium text-gray-900 mb-2'>Parameters</h4>

                  <DataInput
                    schema={triggerInputSchema}
                    value={triggerInput}
                    variablesSchema={{ type: 'object', properties: {} }}
                    onChange={setTriggerInput}
                  />

                  {/* Validation Errors */}
                  {Object.keys(validationErrors).length > 0 && (
                    <div className='mt-3 space-y-2'>
                      {Object.entries(validationErrors).map(([field, error]) => (
                        <div key={field} className='text-xs text-red-600 flex items-start gap-1.5'>
                          <span className='font-medium'>{field}:</span>
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='bg-gray-50 rounded-lg p-4 border'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-gray-400'></div>
                  <span className='text-sm text-gray-600'>No input parameters required</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className='flex justify-end pt-2 border-t border-gray-100'>
              <Button
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  handleRunWorkflow()
                }}
                disabled={isRunButtonDisabled}
                className='text-white px-4 rounded-full'
              >
                <div className='flex items-center gap-2'>
                  {isRunning ? (
                    <div className='h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                  ) : (
                    <Play className='h-3 w-3' />
                  )}
                  Run Workflow
                </div>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Otherwise, just show a simple button
  return (
    <Button
      size={size}
      variant={variant}
      disabled={isDisabled}
      className={`rounded-full ${className}`}
      onClick={(e) => {
        e.stopPropagation()
        handleRunWorkflow()
      }}
    >
      {isRunning ? (
        <>
          <div
            className={`h-4 w-4 ${showLabel ? 'mr-1.5' : ''} animate-spin rounded-full border-2 border-white border-t-transparent`}
          ></div>
          {showLabel && 'Running...'}
        </>
      ) : (
        <>
          <Play className={`h-4 w-4 ${showLabel ? 'mr-1.5' : ''}`} />
          {showLabel && 'Run'}
        </>
      )}
    </Button>
  )
}
