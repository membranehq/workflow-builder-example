'use client'

import { ReactFlow, Background, BackgroundVariant, Node, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { BlockNode } from './nodes/block-node'
import { PlusNode } from './nodes/plus-node'
import { TriggerNode } from './nodes/trigger-node'
import { ConnectionEdge } from './nodes/connection-edge'
import { SimpleEdge } from './nodes/simple-edge'
import { TriggerDialog } from './dialogs/trigger/trigger-dialog'
import type { WorkflowNode, FlowNode, WorkflowEdge } from './types/workflow'
import type { NewNativeNodeData, NativeNodeData } from '@/lib/temporal/types'
import { VERTICAL_SPACING, START_Y, CENTER_X, DEFAULT_ZOOM, FIT_VIEW_PADDING } from './constants'
import { NativeNodeDialog } from './dialogs/native-node'

// Main Component
export function WorkflowEditor() {
  return (
    <div className='w-full h-[calc(100vh-8rem)]'>
      <ReactFlowProvider>
        <WorkflowEditorInner />
      </ReactFlowProvider>
    </div>
  )
}

function WorkflowEditorInner() {
  const { id } = useParams()
  const [nodes, setNodes] = useState<NativeNodeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NativeNodeData | null>(null)
  const [selectedTrigger, setSelectedTrigger] = useState<WorkflowNode | null>(null)
  const [createNodeData, setCreateNodeData] = useState<{ afterId: string } | null>(null)
  const [showTriggerDialog, setShowTriggerDialog] = useState(false)

  const getNodePosition = (index: number) => ({
    x: CENTER_X,
    y: START_Y + index * VERTICAL_SPACING,
  })

  const createNewNode = useCallback((afterId: string) => {
    setCreateNodeData({ afterId })
  }, [])

  const saveNodes = useCallback(
    async (updatedNodes: NativeNodeData[]) => {
      try {
        const response = await fetch(`/api/workflows/${id}/nodes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: updatedNodes }),
        })
        if (!response.ok) throw new Error('Failed to save workflow nodes')
      } catch (error) {
        console.error('Failed to save workflow:', error)
      }
    },
    [id],
  )

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      const updatedNodes = nodes.filter((n) => n.id !== nodeId)
      try {
        await saveNodes(updatedNodes)
        setNodes(updatedNodes)
      } catch (error) {
        console.error('Failed to delete node:', error)
      }
    },
    [nodes, saveNodes],
  )

  const flowElements = useMemo(() => {
    const flowNodes: Node[] = []
    const flowEdges: WorkflowEdge[] = []

    // Always add trigger node or empty trigger placeholder first
    const triggerNode = nodes.find((n) => n.type === 'trigger')
    if (triggerNode) {
      flowNodes.push({
        id: `block-${triggerNode.id}`,
        type: 'trigger',
        position: getNodePosition(0),
        data: {
          label: triggerNode.name,
          node: triggerNode,
          onDelete: handleDeleteNode,
        },
        selected: selectedNode?.id === triggerNode.id,
        draggable: false,
      })
    } else {
      // Show empty trigger placeholder even if there are other nodes
      flowNodes.push({
        id: 'empty-trigger',
        type: 'trigger',
        position: getNodePosition(0),
        data: {
          isEmpty: true,
          onClick: () => setShowTriggerDialog(true),
        },
        draggable: false,
      })
    }

    // Add remaining workflow nodes
    const workflowNodes = nodes.filter((n) => n.type !== 'trigger')
    workflowNodes.forEach((node, index) => {
      const position = getNodePosition(index + 1) // Start after trigger
      flowNodes.push({
        id: `block-${node.id}`,
        type: 'block',
        position,
        data: {
          label: node.name,
          node,
          onDelete: handleDeleteNode,
        },
        selected: selectedNode?.id === node.id,
        draggable: false,
      })
    })

    // Create edges between all nodes (including from empty trigger to first node)
    for (let i = 0; i < flowNodes.length - 1; i++) {
      flowEdges.push({
        id: `e-${flowNodes[i].id}-${flowNodes[i + 1].id}`,
        source: flowNodes[i].id,
        target: flowNodes[i + 1].id,
        type: 'connection',
        data: { createNewNode },
      })
    }

    // Add plus node at the end with half spacing
    const plusNode = {
      id: 'plus',
      type: 'plus',
      position: {
        x: CENTER_X,
        y: START_Y + flowNodes.length * VERTICAL_SPACING - VERTICAL_SPACING / 4, // Add full node spacing plus half spacing
      },
      data: {
        parentId: flowNodes.length > 0 ? flowNodes[flowNodes.length - 1].id : 'root',
        createNewNode,
      },
      draggable: false,
    }

    // Add edge to plus node if there are any nodes
    if (flowNodes.length > 0) {
      const lastNode = flowNodes[flowNodes.length - 1]
      flowEdges.push({
        id: `e-${lastNode.id}-plus`,
        source: lastNode.id,
        type: 'simple',
        target: 'plus',
        data: { createNewNode },
      })
    }

    return {
      nodes: [...flowNodes, plusNode],
      edges: flowEdges,
    }
  }, [nodes, createNewNode, selectedNode, handleDeleteNode])

  const handleCreateNode = (nodeData: NewNativeNodeData) => {
    if (!createNodeData) return
    const newId = `${nodes.length + 1}`
    const newNode: NativeNodeData = { id: newId, ...nodeData }

    setNodes((prevNodes) => {
      const insertIndex = prevNodes.findIndex((n) => n.id === createNodeData.afterId) + 1
      const newNodes = [...prevNodes]
      newNodes.splice(insertIndex, 0, newNode)
      saveNodes(newNodes)
      return newNodes
    })

    // Reset createNodeData to close the dialog
    setCreateNodeData(null)
  }

  const handleSaveNode = async (nodeData: Omit<NativeNodeData, 'id'>) => {
    if (!selectedNode) return
    const updatedNode = { ...nodeData, id: selectedNode.id }

    setNodes((prevNodes) => {
      const newNodes = prevNodes.map((n) => (n.id === selectedNode.id ? updatedNode : n))
      saveNodes(newNodes)
      return newNodes
    })

    setSelectedNode(null)
  }

  const handleNodeClick = (event: React.MouseEvent, node: FlowNode) => {
    if (node.type === 'block') {
      setSelectedNode(node.data.node)
    } else if (node.type === 'trigger' && !node.data.isEmpty) {
      setSelectedTrigger(node.data.node)
      setShowTriggerDialog(true)
    }
  }

  const handleSaveTrigger = async (triggerData: Omit<NativeNodeData, 'id'>) => {
    if (selectedTrigger) {
      // Editing existing trigger
      const updatedTrigger = { ...triggerData, id: selectedTrigger.id }
      const updatedNodes = nodes.map((node) => (node.id === selectedTrigger.id ? updatedTrigger : node))
      await saveNodes(updatedNodes)
      setNodes(updatedNodes)
    } else {
      // Creating new trigger
      const newTrigger = { ...triggerData, id: 'trigger-1' }
      const updatedNodes = [newTrigger, ...nodes.filter((n) => n.type !== 'trigger')]
      await saveNodes(updatedNodes)
      setNodes(updatedNodes)
    }
    setShowTriggerDialog(false)
    setSelectedTrigger(null)
  }

  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        const response = await fetch(`/api/workflows/${id}`)
        if (!response.ok) throw new Error('Failed to load workflow')
        const workflow = await response.json()
        if (workflow.nodes?.length > 0) {
          setNodes(workflow.nodes)
        }
      } catch (error) {
        console.error('Failed to load workflow:', error)
      }
    }

    loadWorkflow()
  }, [id])

  return (
    <>
      <ReactFlow
        nodes={flowElements.nodes}
        edges={flowElements.edges}
        nodeTypes={{ block: BlockNode, plus: PlusNode, trigger: TriggerNode }}
        edgeTypes={{ connection: ConnectionEdge, simple: SimpleEdge }}
        onNodeClick={handleNodeClick}
        className='w-full h-full'
        nodesDraggable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={true}
        maxZoom={1}
        minZoom={1}
        edgesFocusable={false}
        nodesConnectable={false}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: DEFAULT_ZOOM }}
        fitViewOptions={{ padding: FIT_VIEW_PADDING }}
      >
        <Background color='#ccc' variant={BackgroundVariant.Dots} />
      </ReactFlow>
      <TriggerDialog
        mode={selectedTrigger ? 'edit' : 'create'}
        node={selectedTrigger || undefined}
        isOpen={showTriggerDialog}
        onClose={() => {
          setShowTriggerDialog(false)
          setSelectedTrigger(null)
        }}
        onSubmit={handleSaveTrigger}
      />
      {selectedNode ? (
        <NativeNodeDialog
          mode='configure'
          isOpen={Boolean(selectedNode)}
          onClose={() => setSelectedNode(null)}
          onSubmit={handleSaveNode}
          node={selectedNode}
        />
      ) : (
        <NativeNodeDialog
          mode='create'
          isOpen={Boolean(createNodeData)}
          onClose={() => setCreateNodeData(null)}
          onSubmit={handleCreateNode}
        />
      )}
    </>
  )
}
