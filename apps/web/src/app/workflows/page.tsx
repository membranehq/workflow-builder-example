'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { authenticatedFetcher, getAuthHeaders } from '@/lib/fetch-utils'
import {
  Play,
  Calendar,
  Activity,
  FileText,
  Zap,
  Clock,
  History,
} from 'lucide-react'

interface Workflow {
  _id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  nodes: Array<{ id: string; type: string }>
  createdAt: string
  updatedAt: string
  lastRunAt?: string
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

  return (
    <>
      {/* Header Section */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
            Workflows
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Create and manage automated workflows
          </p>
        </div>
        <Button
          onClick={handleCreateWorkflow}
          disabled={isCreating}
          className='gap-2'
        >
          <Zap className='h-4 w-4' />
          {isCreating ? 'Creating...' : 'Create Workflow'}
        </Button>
      </div>

      {/* Workflows List */}
      {isLoading ? (
        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
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
            <Button onClick={handleCreateWorkflow} disabled={isCreating}>
              <Zap className='h-4 w-4 mr-2' />
              {isCreating ? 'Creating...' : 'Create Your First Workflow'}
            </Button>
          </div>
        </div>
      ) : (
        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
          {workflows.map((workflow) => (
            <div
              key={workflow._id}
              className='py-6 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer'
              onClick={() => router.push(`/workflows/${workflow._id}`)}
            >
              <div className='flex items-center justify-between gap-6'>
                {/* Left Section - Info */}
                <div className='flex-1 min-w-0'>
                  <h3 className='text-base font-semibold text-gray-700 dark:text-gray-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                    {workflow.name}
                  </h3>
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
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/workflows/${workflow._id}/runs`)
                    }}
                  >
                    <History className='h-4 w-4 mr-1.5' />
                    Runs
                  </Button>
                  {workflow.status === 'active' && (
                    <Button
                      variant='default'
                      size='sm'
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await fetch(`/api/workflows/${workflow._id}/run`, {
                            method: 'POST',
                            headers: getAuthHeaders(),
                          })
                        } catch (error) {
                          console.error('Failed to run workflow:', error)
                        }
                      }}
                    >
                      <Play className='h-4 w-4 mr-1.5' />
                      Run
                    </Button>
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
