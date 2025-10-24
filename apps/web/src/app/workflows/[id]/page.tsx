'use client'

import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useMemo } from 'react'
import { Play, History, Workflow } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DataInput, DataSchema } from '@membranehq/react'
import { getAuthHeaders } from '@/lib/fetch-utils'
import { WorkflowEditor } from './components/workflow-editor'
import { WorkflowProvider, useWorkflow } from './components/workflow-context'
import Link from 'next/link'

function WorkflowDetailInner({ id }: { id: string }) {
  const { workflow, isLoading, saveWorkflowName } = useWorkflow()
  const router = useRouter()
  const nameRef = useRef<HTMLHeadingElement>(null)
  const originalNameRef = useRef<string>('')

  const [workflowResult, setWorkflowResult] = useState<unknown>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [triggerInput, setTriggerInput] = useState<Record<string, unknown>>({})

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

  const triggerInputSchema = useMemo((): DataSchema | null => {
    if (!firstNode || firstNode.type !== 'trigger') return null
    return firstNode.config?.inputSchema || { type: 'object', properties: {} }
  }, [firstNode])

  const handleRunWorkflow = async () => {
    try {
      setIsRunning(true)
      setWorkflowResult(null)

      const authHeaders = getAuthHeaders()

      const response = await fetch(`/api/workflows/${id}/run`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: triggerInput }),
      })

      if (!response.ok) throw new Error('Failed to run workflow')

      const result = await response.json()

      // Navigate to the specific run page immediately after starting the workflow
      router.push(`/runs/${result.runId}`)
    } catch (error) {
      console.error('Failed to run workflow:', error)
      setWorkflowResult('Error: Failed to run workflow')
      setIsRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-lg font-medium text-gray-900 dark:text-white'>Workflow not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className='h-screen flex flex-col w-full'>
      <div className='border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-3'>
        <div className='flex items-center justify-between'>
          {/* Name editor on the left */}
          <div className='flex items-center gap-2'>
            <Link href='/workflows' className='flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'>
              <Workflow className='h-4 w-4' />
              Workflows
            </Link>
            <span className='text-base text-gray-500'>/</span>
            <h1
              ref={nameRef}
              contentEditable
              suppressContentEditableWarning
              className='text-base font-semibold text-gray-900 dark:text-white outline-none px-2 py-1 -mx-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors cursor-text min-w-[200px]'
              onFocus={(e) => {
                originalNameRef.current = e.currentTarget.textContent || ''
                // Select all text on focus
                const range = document.createRange()
                range.selectNodeContents(e.currentTarget)
                const selection = window.getSelection()
                selection?.removeAllRanges()
                selection?.addRange(range)
              }}
              onBlur={(e) => {
                const newName = e.currentTarget.textContent?.trim() || ''
                if (newName && newName !== originalNameRef.current) {
                  saveWorkflowName(newName)
                } else if (!newName) {
                  // Restore original name if empty
                  e.currentTarget.textContent = originalNameRef.current
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  e.currentTarget.textContent = originalNameRef.current
                  e.currentTarget.blur()
                }
              }}
            >
              {workflow.name}
            </h1>
          </div>

          {/* Run button and View Runs button on the far right */}
          <div className='flex items-center gap-2'>
            <Link href={`/runs?filters=${encodeURIComponent(JSON.stringify([{ id: Date.now().toString(), field: 'workflow', operator: 'equals', value: id }]))}`} className='no-underline'>
              <Button
                size='sm'
                variant='outline'
                className='p-2'
              >
                <History className='h-4 w-4' />
              </Button>
            </Link>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size='sm'
                  variant='default'
                  disabled={isRunning || !isFirstNodeManualTrigger}

                >
                  <Play className='h-4 w-4 mr-1' />
                  Run Workflow
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-96' align='end' side='bottom'>
                <div className='space-y-6'>
                  {/* Header */}
                  <div className='border-b border-gray-100 pb-3'>
                    <div className='flex items-center gap-2'>
                      <Play className='h-4 w-4 text-green-600' />
                      <h3 className='font-semibold text-sm text-gray-900'>Run Workflow</h3>
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>Configure input parameters for the trigger</p>
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
                      onClick={handleRunWorkflow}
                      disabled={isRunning}
                      className=' text-white px-4'
                    >
                      {isRunning ? (
                        <div className='flex items-center gap-2'>
                          <div className='h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                          Running...
                        </div>
                      ) : (
                        <div className='flex items-center gap-2'>
                          <Play className='h-3 w-3' />
                          Run Workflow
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {!!workflowResult && (
        <div className='border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3'>
          <div className='max-w-7xl mx-auto'>
            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>Workflow Result:</h3>
            <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3'>
              <pre className='text-green-800 dark:text-green-200 font-mono text-sm overflow-auto'>
                {JSON.stringify(workflowResult, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className='flex-1 relative bg-gray-50 dark:bg-gray-900'>
        <WorkflowEditor />
      </div>
    </div>
  )
}

export default function WorkflowDetailPage() {
  const { id } = useParams()
  const resolvedId = Array.isArray(id) ? id[0] : (id as string)
  if (!resolvedId) return null
  return (
    <WorkflowProvider id={resolvedId}>
      <WorkflowDetailInner id={resolvedId} />
    </WorkflowProvider>
  )
}
