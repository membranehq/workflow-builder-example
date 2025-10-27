'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { RunWorkflowButton } from '@/components/run-workflow-button'
import { useParams } from 'next/navigation'
import { useRef, Suspense } from 'react'
import { History, Workflow } from 'lucide-react'
import { WorkflowEditor } from './components/workflow-editor'
import { WorkflowProvider, useWorkflow } from './components/workflow-context'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

function WorkflowDetailInner({ id }: { id: string }) {
  const { workflow, isLoading, saveWorkflowName, activateWorkflow, deactivateWorkflow } = useWorkflow()
  const nameRef = useRef<HTMLHeadingElement>(null)
  const originalNameRef = useRef<string>('')

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
    <WorkflowEditor
      header={
        <div className='flex items-center justify-between w-full px-8'>
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

          {/* Status toggle, Run button and View Runs button on the right */}
          <div className='flex items-center gap-3'>
            {/* Status toggle */}
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                {workflow.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={workflow.status === 'active'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    activateWorkflow()
                  } else {
                    deactivateWorkflow()
                  }
                }}
              />
            </div>
            <Link href={`/runs?filters=${encodeURIComponent(JSON.stringify([{ id: Date.now().toString(), field: 'workflow', operator: 'equals', value: id }]))}`} className='no-underline'>
              <Button
                size='sm'
                variant='outline'
                className='p-2 rounded-full'
              >
                <History className='h-4 w-4' />
              </Button>
            </Link>
            <RunWorkflowButton
              workflowId={id}
              workflowStatus={workflow.status}
              size='sm'
              variant='default'
              showLabel={true}
            />
          </div>
        </div>
      }
    />
  )
}

export default function WorkflowDetailPage() {
  const { id } = useParams()
  const resolvedId = Array.isArray(id) ? id[0] : (id as string)
  if (!resolvedId) return null
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-200 dark:border-gray-800 py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    }>
      <WorkflowProvider id={resolvedId}>
        <WorkflowDetailInner id={resolvedId} />
      </WorkflowProvider>
    </Suspense>
  )
}
