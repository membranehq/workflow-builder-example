'use client'

import React from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { authenticatedFetcher, getAuthHeaders } from '@/lib/fetch-utils'
import type { WorkflowNode, WorkflowState } from './types/workflow'
import { NODE_TYPES, TRIGGER_TYPES } from '@/lib/node-types'

type WorkflowContextValue = {
  workflow: WorkflowState | null
  isLoading: boolean
  error: Error | undefined
  setWorkflow: (next: WorkflowState | ((prev: WorkflowState | null) => WorkflowState)) => void
  saveNodes: (nodes: WorkflowNode[]) => Promise<void>
  saveWorkflowName: (name: string) => Promise<void>
  nodeTypes: typeof NODE_TYPES
  triggerTypes: typeof TRIGGER_TYPES
  refresh: () => void
  deleteNode: (nodeId: string) => void
  selectedNodeId: string | null
  setSelectedNodeId: (nodeId: string | null) => void
}

const WorkflowContext = React.createContext<WorkflowContextValue | undefined>(undefined)

function putJson(url: string, body: unknown) {
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed request: ${res.status}`)
    }
    return res
  })
}

function patchJson(url: string, body: unknown) {
  return fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed request: ${res.status}`)
    }
    return res
  })
}

export function WorkflowProvider({ id, children }: { id: string; children: React.ReactNode }) {
  const key = id ? `/api/workflows/${id}` : null
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)

  const { data, error, isLoading, mutate } = useSWR<WorkflowState>(key, authenticatedFetcher)

  // Auto-select first node when workflow loads
  React.useEffect(() => {
    if (data?.nodes && data.nodes.length > 0 && !selectedNodeId) {
      const firstNode = data.nodes[0]
      setSelectedNodeId(firstNode.id)
    }
  }, [data?.nodes, selectedNodeId])

  const { trigger: triggerSave } = useSWRMutation(
    key ? `${key}/nodes` : null,
    async (_url, { arg }: { arg: WorkflowState['nodes'] }) => {
      if (!key) return
      await putJson(`${key}/nodes`, { nodes: arg })
      // do not rely on server response to revalidate; optimistic update instead
    }
  )

  const setWorkflow = React.useCallback(
    (next: WorkflowState | ((prev: WorkflowState | null) => WorkflowState)) => {
      mutate((prev) => {
        const nextValue = typeof next === 'function' ? (next as (p: WorkflowState | null) => WorkflowState)(prev ?? null) : next
        return nextValue
      }, { revalidate: false })
    },
    [mutate]
  )

  const saveNodes = React.useCallback(
    async (nodes: WorkflowState['nodes']) => {
      await triggerSave(nodes)
      mutate((prev) => (prev ? { ...prev, nodes } as WorkflowState : prev), { revalidate: false })
    },
    [triggerSave, mutate]
  )

  const deleteNode = React.useCallback(
    (nodeId: string) => {
      const current = data
      if (!current) return
      const updatedNodes = (current.nodes ?? []).filter((n) => n.id !== nodeId)
      // Optimistic update
      setWorkflow({ ...current, nodes: updatedNodes })
      // Persist
      void saveNodes(updatedNodes)
    },
    [data, setWorkflow, saveNodes]
  )

  const saveWorkflowName = React.useCallback(
    async (name: string) => {
      if (!key) return
      // Optimistic update
      mutate((prev) => (prev ? { ...prev, name } : prev), { revalidate: false })
      // Persist
      await patchJson(key, { name })
    },
    [key, mutate]
  )

  const value = React.useMemo<WorkflowContextValue>(() => ({
    workflow: data ?? null,
    isLoading,
    error: error as Error | undefined,
    setWorkflow,
    saveNodes,
    saveWorkflowName,
    nodeTypes: NODE_TYPES,
    triggerTypes: TRIGGER_TYPES,
    refresh: () => mutate(),
    deleteNode,
    selectedNodeId,
    setSelectedNodeId,
  }), [data, isLoading, error, setWorkflow, saveNodes, saveWorkflowName, mutate, deleteNode, selectedNodeId, setSelectedNodeId])

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
}

export function useWorkflow() {
  const ctx = React.useContext(WorkflowContext)
  if (!ctx) throw new Error('useWorkflow must be used within a WorkflowProvider')
  return ctx
}


