'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { CreateWorkflowDialog } from './components/create-workflow-dialog'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { authenticatedFetcher, getAuthHeaders } from '@/lib/fetch-utils'
import {
  Play,
  Settings,
  Calendar,
  Activity,
  FileText,
  Zap,
  Clock,
} from 'lucide-react'

interface Workflow {
  _id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'inactive'
  nodes: Array<{ id: string; type: string }>
  createdAt: string
  updatedAt: string
  lastRunAt?: string
}

export default function WorkflowsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()

  const { data: workflows, isLoading, mutate } = useSWR<Workflow[]>(
    '/api/workflows',
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
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
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      {/* Header Section */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Workflows
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Create and manage automated workflows
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className='gap-2'
        >
          <Zap className='h-4 w-4' />
          Create Workflow
        </Button>
      </div>

      {/* Workflows List */}
      {isLoading ? (
        <div className='space-y-4'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'
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
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Zap className='h-4 w-4 mr-2' />
              Create Your First Workflow
            </Button>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {workflows.map((workflow) => (
            <div
              key={workflow._id}
              className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-lg group'
            >
              <div className='p-6'>
                <div className='flex items-center justify-between gap-6'>
                  {/* Left Section - Info */}
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
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
                        {workflow.status}
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
                      onClick={() => router.push(`/workflows/${workflow._id}`)}
                    >
                      <Settings className='h-4 w-4 mr-1.5' />
                      Configure
                    </Button>
                    {workflow.status === 'active' && (
                      <Button
                        variant='default'
                        size='sm'
                        onClick={async () => {
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
            </div>
          ))}
        </div>
      )}

      <CreateWorkflowDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) mutate()
        }}
      />
    </div>
  )
}
