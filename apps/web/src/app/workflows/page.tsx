'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RunWorkflowButton } from '@/components/run-workflow-button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { authenticatedFetcher, getAuthHeaders } from '@/lib/fetch-utils'
import {
  Calendar,
  Activity,
  FileText,
  Zap,
  Clock,
  History,
  Workflow as WorkflowIcon,
} from 'lucide-react'
import { useIntegration } from '@membranehq/react'
import Image from 'next/image'

interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action'
  nodeType?: string
  triggerType?: string
  parametersSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  config?: Record<string, unknown>
  ready?: boolean
}

interface Workflow {
  _id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  nodes: WorkflowNode[]
  userId?: string
  customerId?: string
  version: number
  lastRunAt?: string
  createdAt: string
  updatedAt: string
}

function IntegrationLogo({ integrationKey, zIndex }: { integrationKey: string; zIndex: number }) {
  const { integration } = useIntegration(integrationKey)

  if (!integration) {
    return null
  }

  return (
    <div
      className='relative inline-block'
      style={{
        zIndex,
        marginLeft: zIndex > 0 ? '-6px' : '0',
      }}
    >
      <div className='w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm'>
        {integration.logoUri ? (
          <Image
            src={integration.logoUri}
            alt={integration.name}
            width={24}
            height={24}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-[10px] font-semibold text-gray-600 dark:text-gray-300'>
            {integration.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

function IntegrationLogos({ integrationKeys }: { integrationKeys: string[] }) {
  const maxVisible = 3
  const visibleKeys = integrationKeys.slice(0, maxVisible)
  const remainingCount = Math.max(0, integrationKeys.length - maxVisible)

  if (integrationKeys.length === 0) {
    return null
  }

  return (
    <div className='flex items-center'>
      {visibleKeys.map((key, index) => (
        <IntegrationLogo key={key} integrationKey={key} zIndex={visibleKeys.length - index} />
      ))}
      {remainingCount > 0 && (
        <div
          className='relative inline-block w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 shadow-sm'
          style={{
            zIndex: 0,
            marginLeft: '-6px',
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

export default function WorkflowsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const { data: workflows, isLoading } = useSWR<Workflow[]>(
    '/api/workflows',
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
    }
  )


  const handleCreateWorkflow = async () => {
    try {
      setIsCreating(true)
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Untitled Workflow',
          description: ''
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create workflow')
      }

      const data = await response.json()
      router.push(`/workflows/${data.id}`)
    } catch (error) {
      console.error('Failed to create workflow:', error)
      setIsCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString()
  }

  const getIntegrationKeys = (workflow: Workflow): string[] => {
    const integrationKeys: string[] = []
    const seen = new Set<string>()

    workflow.nodes.forEach((node) => {
      const integrationKey = node.config?.integrationKey as string | undefined
      if (integrationKey && !seen.has(integrationKey)) {
        integrationKeys.push(integrationKey)
        seen.add(integrationKey)
      }
    })

    return integrationKeys
  }

  return (
    <>
      {/* Header Section */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2'>
            <WorkflowIcon className='h-7 w-7' />
            Workflows
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Connect and automate workflows across all your favorite apps
          </p>
        </div>
        <Button
          onClick={handleCreateWorkflow}
          disabled={isCreating}
          className='gap-2 rounded-full'
        >
          <Zap className='h-4 w-4' />
          {isCreating ? 'Creating...' : 'Create Workflow'}
        </Button>
      </div>


      {/* Workflows List */}
      {isLoading ? (
        <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 divide-y divide-gray-200 dark:divide-gray-700'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='py-6 px-4'
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <Skeleton className='h-6 w-1/3 mb-2' />
                  <Skeleton className='h-4 w-1/2 mb-3' />
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-5 w-16' />
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Skeleton className='h-9 w-24' />
                  <Skeleton className='h-9 w-20' />
                  <Skeleton className='h-9 w-16' />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !workflows || workflows.length === 0 ? (
        <div className='bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12'>
          <div className='text-center'>
            <div className='mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4'>
              <FileText className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No workflows yet
            </h3>
            <p className='text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto'>
              Get started by creating your first workflow to automate your processes.
            </p>
            <Button onClick={handleCreateWorkflow} disabled={isCreating} className='rounded-full'>
              <Zap className='h-4 w-4 mr-2' />
              {isCreating ? 'Creating...' : 'Create Your First Workflow'}
            </Button>
          </div>
        </div>
      ) : (
        <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 divide-y divide-gray-200 dark:divide-gray-700'>
          {workflows.map((workflow) => (
            <div
              key={workflow._id}
              className='py-6 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer'
              onClick={() => router.push(`/workflows/${workflow._id}`)}
            >
              <div className='flex items-center justify-between gap-6'>
                {/* Left Section - Info */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-3 mb-1'>
                    <h3 className='text-base font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                      {workflow.name}
                    </h3>
                    <IntegrationLogos integrationKeys={getIntegrationKeys(workflow)} />
                  </div>
                  {workflow.description && (
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1'>
                      {workflow.description}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className='flex flex-wrap items-center gap-4 text-sm'>
                    <Badge className={getStatusColor(workflow.status)}>
                      {workflow.status === 'active' && <Activity className='h-3 w-3 mr-1' />}
                      {getStatusText(workflow.status)}
                    </Badge>

                    <span className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5'>
                      <Zap className='h-3.5 w-3.5' />
                      {workflow.nodes?.length || 0} nodes
                    </span>

                    <span className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5'>
                      <Calendar className='h-3.5 w-3.5' />
                      Created {formatDate(workflow.createdAt)}
                    </span>

                    {workflow.lastRunAt && (
                      <span className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5'>
                        <Clock className='h-3.5 w-3.5' />
                        Last run {formatDate(workflow.lastRunAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='rounded-full'
                    onClick={(e) => {
                      e.stopPropagation()
                      const filter = {
                        id: Date.now().toString(),
                        field: 'workflow',
                        operator: 'equals',
                        value: workflow._id
                      }
                      const filtersParam = encodeURIComponent(JSON.stringify([filter]))
                      router.push(`/runs?filters=${filtersParam}`)
                    }}
                  >
                    <History className='h-4 w-4 mr-1.5' />
                    Runs
                  </Button>
                  {workflow.status === 'active' && (
                    <RunWorkflowButton
                      workflowId={workflow._id}
                      workflowStatus={workflow.status}
                      size='sm'
                      variant='default'
                      showLabel={true}
                      navigateToRun={false}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
