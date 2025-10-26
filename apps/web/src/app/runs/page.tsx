'use client'

import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, X, Filter } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authenticatedFetcher } from '@/lib/fetch-utils'
import { formatTimeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMemo, useState, useEffect, Suspense } from 'react'

interface WorkflowRun {
  _id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  input?: unknown
  results: Array<{
    nodeId: string
    success: boolean
    message: string
    output?: unknown
    error?: {
      message: string
      code?: string
      details?: unknown
    }
  }>
  summary: {
    totalNodes: number
    successfulNodes: number
    failedNodes: number
    successRate: number
  }
  startedAt: string
  completedAt?: string
  executionTime?: number
  error?: string
  workflow?: {
    _id: string
    name: string
    description?: string
  }
}

interface Workflow {
  _id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
}

interface Filter {
  id: string
  field: 'status' | 'workflow'
  value: string
}

interface FilterOption {
  value: string
  label: string
}


function RunsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<Filter[]>([])

  // Initialize filters from URL on component mount
  useEffect(() => {
    const urlFilters = searchParams.get('filters')
    if (urlFilters) {
      try {
        const parsedFilters = JSON.parse(decodeURIComponent(urlFilters))
        setFilters(parsedFilters)
      } catch (error) {
        console.error('Failed to parse filters from URL:', error)
      }
    }
  }, [searchParams])

  // Update URL when filters change
  const updateURL = (newFilters: Filter[]) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newFilters.length > 0) {
      params.set('filters', encodeURIComponent(JSON.stringify(newFilters)))
    } else {
      params.delete('filters')
    }
    router.replace(`/runs?${params.toString()}`)
  }

  // Fetch all runs with SWR
  const { data: runs, isLoading } = useSWR<WorkflowRun[]>(
    '/api/runs',
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      // Auto-refresh every 3 seconds if there are running workflows
      refreshInterval: (data) => {
        const hasRunningWorkflows = data?.some(run => run.status === 'running')
        return hasRunningWorkflows ? 3000 : 0
      },
    }
  )

  // Fetch workflows for the filter dropdown
  const { data: workflows } = useSWR<Workflow[]>(
    '/api/workflows',
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  // Filter runs based on applied filters
  const filteredRuns = useMemo(() => {
    if (!runs || filters.length === 0) return runs || []

    return runs.filter(run => {
      return filters.every(filter => {
        // Skip filtering if no value is selected
        if (!filter.value || filter.value.trim() === '') {
          return true
        }

        if (filter.field === 'status') {
          return run.status === filter.value
        } else if (filter.field === 'workflow') {
          return run.workflowId === filter.value
        }
        return true
      })
    })
  }, [runs, filters])

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: 'status',
      value: ''
    }
    const newFilters = [...filters, newFilter]
    setFilters(newFilters)
    updateURL(newFilters)
  }

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    const newFilters = filters.map(filter =>
      filter.id === id ? { ...filter, ...updates } : filter
    )
    setFilters(newFilters)
    updateURL(newFilters)
  }

  const removeFilter = (id: string) => {
    const newFilters = filters.filter(filter => filter.id !== id)
    setFilters(newFilters)
    updateURL(newFilters)
  }

  const clearAllFilters = () => {
    setFilters([])
    updateURL([])
  }

  const getFieldOptions = (): FilterOption[] => [
    { value: 'status', label: 'Status' },
    { value: 'workflow', label: 'Workflow' }
  ]


  const getValueOptions = (field: string): FilterOption[] => {
    if (field === 'status') {
      return [
        { value: 'running', label: 'Running' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' }
      ]
    } else if (field === 'workflow') {
      return workflows?.map(workflow => ({
        value: workflow._id,
        label: workflow.name
      })) || []
    }
    return []
  }


  const getStatusIconLarge = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="h-3 w-3 rounded-full bg-green-600" />
      case 'failed':
        return <div className="h-3 w-3 rounded-full bg-red-500" />
      case 'running':
        return <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-500" />
    }
  }

  const formatDuration = (executionTime?: number) => {
    if (!executionTime) return 'N/A'
    if (executionTime < 1000) return `${executionTime}ms`
    return `${(executionTime / 1000).toFixed(2)}s`
  }

  const formatDate = (dateString: string) => {
    return formatTimeAgo(dateString)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Workflow Runs
            </h1>
            {filters.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filters.length} filter{filters.length > 1 ? 's' : ''} applied
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-6 w-6 p-0"
                  onClick={clearAllFilters}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Filter Controls */}
        <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2 gap-1 flex flex-wrap">
          {filters.map((filter) => (
            <div key={filter.id} className="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
              {/* Field Selector */}
              <Select
                value={filter.field}
                onValueChange={(value) => updateFilter(filter.id, { field: value as 'status' | 'workflow', value: '' })}
              >
                <SelectTrigger className="w-28 h-8 border-0 bg-transparent rounded-none focus:ring-0 focus:ring-offset-0 hover:bg-gray-200 dark:hover:bg-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Visual Separator */}
              <div className="w-px h-5 bg-gray-300 dark:bg-gray-500"></div>

              {/* Value Selector */}
              <Select
                value={filter.value}
                onValueChange={(value) => updateFilter(filter.id, { value })}
              >
                <SelectTrigger className="w-40 h-8 border-0 bg-transparent rounded-none focus:ring-0 focus:ring-offset-0 hover:bg-gray-200 dark:hover:bg-gray-600">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {getValueOptions(filter.field).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Visual Separator */}
              <div className="w-px h-5 bg-gray-300 dark:bg-gray-500"></div>

              {/* Clear Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(filter.id)}
                className="h-8 w-8 p-0 border-0 bg-transparent rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addFilter}
            className={`border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-full flex items-center justify-center ${filters.length === 0 ? 'h-8 px-3' : 'h-8 w-8 p-0'
              }`}
          >
            <span className="text-sm">
              {filters.length === 0 ? 'Filter +' : '+'}
            </span>
          </Button>
        </div>
      </div>

      {/* Runs List */}
      <div className="flex-1 overflow-auto pt-4 pr-4 pb-4">
        {isLoading ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-4 px-4">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {!filteredRuns || filteredRuns.length === 0 ? (
              <div className="text-center py-8">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {filters.length > 0 ? 'No runs match your filters' : 'No runs yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filters.length > 0
                    ? 'Try adjusting your filters to see more results.'
                    : 'Run your workflows to see execution history here.'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-950 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Workflow
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRuns.map((run) => (
                      <tr
                        key={run._id}
                        onClick={() => router.push(`/runs/${run._id}`)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getStatusIconLarge(run.status)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {run.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {run.workflow?.name || 'Unknown Workflow'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(run.startedAt)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDuration(run.executionTime)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RunsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-200 dark:border-gray-800 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Workflow Runs
            </h1>
          </div>
        </div>
        <div className="flex-1 overflow-auto pt-4 pr-4 pb-4">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-4 px-4">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <RunsPageContent />
    </Suspense>
  )
}

