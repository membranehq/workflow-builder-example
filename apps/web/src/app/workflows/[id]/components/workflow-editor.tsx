'use client'

import React, { useCallback, useState } from 'react'
import { Node } from '@xyflow/react'

import { WorkflowNode } from './types/workflow'
import { useWorkflow } from './workflow-context'
import { NodeCreateDialog } from './dialogs/node-create-dialog'
import { TriggerCreateDialog } from './dialogs/trigger-create-dialog'
import { v4 as uuidv4 } from 'uuid'
import { ConfigPanel } from './config-panel'
import { WorkflowNodeRenderer } from './workflow-node-renderer'
import { ResizableSplitLayout } from '@/components/ui/resizable-split-layout'

interface WorkflowEditorProps {
  header?: React.ReactNode
  viewOnly?: boolean
  onNodeClick?: (nodeId: string) => void
  runResults?: Array<{
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
}

export function WorkflowEditor({ header, viewOnly = false, onNodeClick, runResults }: WorkflowEditorProps = {}) {
  const { workflow, saveNodes, nodeTypes: nodeTypeDefinitions, triggerTypes, deleteNode, selectedNodeId, setSelectedNodeId } = useWorkflow()

  const selectedNode = selectedNodeId ? (workflow?.nodes ?? []).find((n) => n.id === selectedNodeId) ?? null : null

  const [nodeCreateDialogOpen, setNodeCreateDialogOpen] = useState(false)
  const [triggerCreateDialogOpen, setTriggerCreateDialogOpen] = useState(false)
  const [pendingAfterId, setPendingAfterId] = useState<string | undefined>(undefined)

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!viewOnly) {
        deleteNode(nodeId)
      }
    },
    [deleteNode, viewOnly],
  )

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (viewOnly && onNodeClick) {
        onNodeClick(node.id)
      } else {
        const workflowNode = (workflow?.nodes ?? []).find((n) => n.id === node.id)
        if (!workflowNode) return
        setSelectedNodeId(workflowNode.id)
      }
    },
    [workflow?.nodes, setSelectedNodeId, viewOnly, onNodeClick],
  )

  const handleNodeUpdate = useCallback(
    (nodeData: Omit<WorkflowNode, 'id'>) => {
      if (!workflow || !selectedNode) return

      const updatedNodes = workflow.nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, ...nodeData } : node,
      )
      // Don't do optimistic update - wait for API response with all updates (like ready field, output schemas, etc.)
      void saveNodes(updatedNodes)
    },
    [selectedNode, workflow, saveNodes],
  )

  const handleCreateNodeFromType = useCallback(
    (selectedType: string, config?: Record<string, unknown>) => {
      if (!workflow || viewOnly) return

      const baseName = (nodeTypeDefinitions[selectedType]?.name ?? selectedType) as string
      const existingNodes = workflow.nodes ?? []

      // Check if name already exists and find unique name
      let finalName = baseName
      let counter = 1
      while (existingNodes.some((node) => node.name === finalName)) {
        finalName = `${baseName} ${counter}`
        counter++
      }

      const newNode: WorkflowNode = {
        id: uuidv4(),
        name: finalName,
        type: 'action',
        nodeType: selectedType,
        config: config || {},
      }
      const updatedNodes = [...(workflow.nodes ?? [])]
      if (pendingAfterId) {
        const afterIndex = updatedNodes.findIndex((n) => n.id === pendingAfterId)
        if (afterIndex >= 0) updatedNodes.splice(afterIndex + 1, 0, newNode)
        else updatedNodes.push(newNode)
      } else {
        updatedNodes.push(newNode)
      }
      setPendingAfterId(undefined)
      setNodeCreateDialogOpen(false)
      setSelectedNodeId(newNode.id)
      // Don't do optimistic update - wait for API response with all updates (output schemas, etc.)
      void saveNodes(updatedNodes)
    },
    [workflow, nodeTypeDefinitions, pendingAfterId, saveNodes, setSelectedNodeId, viewOnly],
  )

  const handleCreateTriggerFromType = useCallback(
    (selectedType: string) => {
      if (!workflow || viewOnly) return
      const name = triggerTypes[selectedType]?.name ?? selectedType
      const newTrigger: WorkflowNode = {
        id: uuidv4(),
        name,
        type: 'trigger',
        triggerType: selectedType,
      }
      const updatedNodes = [...(workflow.nodes ?? [])]
      const existingIndex = updatedNodes.findIndex((n) => n.type === 'trigger')
      if (existingIndex >= 0) updatedNodes[existingIndex] = newTrigger
      else updatedNodes.unshift(newTrigger)
      setTriggerCreateDialogOpen(false)
      // Don't do optimistic update - wait for API response with all updates (output schemas, etc.)
      void saveNodes(updatedNodes)
    },
    [workflow, triggerTypes, saveNodes, viewOnly],
  )

  // Handle plus node clicks for creating new nodes
  const handlePlusNodeClick = useCallback(
    (afterId: string) => {
      if (viewOnly) return
      setPendingAfterId(afterId)
      setNodeCreateDialogOpen(true)
    },
    [viewOnly],
  )

  // Handle trigger placeholder clicks
  const handleTriggerPlaceholderClick = useCallback(() => {
    if (viewOnly) return
    setTriggerCreateDialogOpen(true)
  }, [viewOnly])

  return (
    <>
      <ResizableSplitLayout
        header={header}
        leftPane={
          <WorkflowNodeRenderer
            nodes={workflow?.nodes ?? []}
            nodeTypes={nodeTypeDefinitions}
            triggerTypes={triggerTypes}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
            onDeleteNode={handleDeleteNode}
            onPlusNodeClick={handlePlusNodeClick}
            onTriggerPlaceholderClick={handleTriggerPlaceholderClick}
            viewOnly={viewOnly}
            runResults={runResults}
          />
        }
        rightPane={
          !viewOnly && selectedNode ? (
            <ConfigPanel
              selectedNode={selectedNode}
              onUpdateNode={handleNodeUpdate}
              nodeTypes={nodeTypeDefinitions}
              triggerTypes={triggerTypes}
            />
          ) : undefined
        }
      />

      {!viewOnly && (
        <>
          <NodeCreateDialog
            isOpen={nodeCreateDialogOpen}
            onClose={() => {
              setNodeCreateDialogOpen(false)
              setPendingAfterId(undefined)
            }}
            onCreate={handleCreateNodeFromType}
          />

          <TriggerCreateDialog
            isOpen={triggerCreateDialogOpen}
            onClose={() => setTriggerCreateDialogOpen(false)}
            triggerTypes={triggerTypes}
            onCreate={handleCreateTriggerFromType}
          />
        </>
      )}
    </>
  )
}
