'use client'

import React, { useCallback, useState, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { WorkflowNode, NodeData } from './types/workflow'
import { useWorkflow } from './workflow-context'
import { TriggerNode } from './nodes/trigger-node'
import { ActionNode } from './nodes/action-node'
import { PlusNode } from './nodes/plus-node'
import { EditNodeDialog } from './dialogs/edit-action-dialog'
import { NodeCreateDialog } from './dialogs/node-create-dialog'
import { TriggerCreateDialog } from './dialogs/trigger/trigger-create-dialog'
import { v4 as uuidv4 } from 'uuid'
import { EditTriggerDialog } from './dialogs/trigger/edit-trigger-dialog'

type WorkflowEditorProps = Record<string, never>

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  plus: PlusNode,
}

export function WorkflowEditor() {
  const { workflow, setWorkflow, saveNodes, nodeTypes: nodeTypeDefinitions, triggerTypes, deleteNode } = useWorkflow()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [triggerDialog, setTriggerDialog] = useState<{
    isOpen: boolean
    node?: WorkflowNode
  }>({
    isOpen: false,
  })

  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    node?: WorkflowNode
    afterNodeId?: string
  }>({
    isOpen: false,
  })

  const [nodeCreateDialogOpen, setNodeCreateDialogOpen] = useState(false)
  const [triggerCreateDialogOpen, setTriggerCreateDialogOpen] = useState(false)
  const [pendingAfterId, setPendingAfterId] = useState<string | undefined>(undefined)

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      deleteNode(nodeId)
    },
    [deleteNode],
  )

  const reactFlowNodes = useMemo(() => {
    const flowNodes: Node[] = []

    const safeNodes = workflow?.nodes ?? []

    // Add trigger node (first node, if exists)
    const triggerNode = safeNodes.find((node) => node.type === 'trigger')
    if (triggerNode) {
      const triggerTypeMetadata = triggerNode.triggerType ? triggerTypes[triggerNode.triggerType] : undefined
      flowNodes.push({
        id: triggerNode.id,
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: triggerNode.name,
          node: triggerNode,
          onDelete: handleDeleteNode,
          triggerTypeMetadata,
        } as NodeData,
      })
    } else {
      // Add empty trigger node
      flowNodes.push({
        id: 'trigger-placeholder',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          isEmpty: true,
          onClick: () => setTriggerCreateDialogOpen(true),
        },
      })
    }

    // Add action nodes
    const actionNodes = safeNodes.filter((node) => node.type === 'action')
    const nodeHeight = 48 // Height of each node (scaled to 60%)
    const firstActionTop = 210 // reduced so gap from trigger ~60px
    const actionStep = 109 // nodeHeight + ~61px desired gap between actions
    actionNodes.forEach((node, index) => {
      const nodeTypeMetadata = node.nodeType ? nodeTypeDefinitions[node.nodeType] : undefined
      const actionY = firstActionTop + index * actionStep
      flowNodes.push({
        id: node.id,
        type: 'action',
        position: { x: 100, y: actionY },
        data: {
          label: node.name,
          node: node,
          onDelete: handleDeleteNode,
          nodeTypeMetadata,
        } as NodeData,
      })

      // Add plus node between current action and next action (or at end)
      const currentActionBottom = actionY + nodeHeight
      const nextActionTop = index < actionNodes.length - 1 ? firstActionTop + (index + 1) * actionStep : actionY + actionStep
      const plusY = (currentActionBottom + nextActionTop) / 2

      flowNodes.push({
        id: `plus-${node.id}`,
        type: 'plus',
        position: { x: 100, y: plusY },
        data: {
          parentId: node.id,
          createNewNode: (afterId: string) => {
            setPendingAfterId(afterId)
            setNodeCreateDialogOpen(true)
          },
        },
      })
    })

    // Add plus node between trigger and first action, or after trigger if no actions
    if (triggerNode) {
      if (actionNodes.length === 0) {
        // No action nodes - place plus node below trigger
        const triggerBottom = 100 + nodeHeight // 100 (trigger top) + 48 (height)
        flowNodes.push({
          id: 'plus-trigger',
          type: 'plus',
          position: { x: 100, y: triggerBottom + 31 }, // ~half of desired ~61px gap
          data: {
            parentId: triggerNode.id,
            createNewNode: (afterId: string) => {
              setPendingAfterId(afterId)
              setNodeCreateDialogOpen(true)
            },
          },
        })
      } else {
        // Has action nodes - place plus node between trigger and first action
        const triggerBottom = 100 + nodeHeight // 100 + 48 = 148
        const plusY = (triggerBottom + firstActionTop) / 2 // midpoint between trigger bottom and first action top

        flowNodes.push({
          id: 'plus-trigger',
          type: 'plus',
          position: { x: 100, y: plusY },
          data: {
            parentId: triggerNode.id,
            createNewNode: (afterId: string) => {
              setPendingAfterId(afterId)
              setNodeCreateDialogOpen(true)
            },
          },
        })
      }
    }

    return flowNodes
  }, [workflow?.nodes, handleDeleteNode, triggerTypes, nodeTypeDefinitions])

  // Convert to edges for ReactFlow
  const reactFlowEdges = useMemo(() => {
    const flowEdges: Edge[] = []

    const safeNodes = workflow?.nodes ?? []
    const triggerNode = safeNodes.find((node) => node.type === 'trigger')
    const actionNodes = safeNodes.filter((node) => node.type === 'action')

    if (triggerNode) {
      if (actionNodes.length > 0) {
        // Connect trigger to first action
        flowEdges.push({
          id: `trigger-${actionNodes[0].id}`,
          source: triggerNode.id,
          target: actionNodes[0].id,
          type: 'smoothstep',
        })

        // Connect action nodes in sequence
        for (let i = 0; i < actionNodes.length - 1; i++) {
          flowEdges.push({
            id: `${actionNodes[i].id}-${actionNodes[i + 1].id}`,
            source: actionNodes[i].id,
            target: actionNodes[i + 1].id,
            type: 'smoothstep',
          })
        }

        // Connect last action to its plus node
        const lastAction = actionNodes[actionNodes.length - 1]
        flowEdges.push({
          id: `${lastAction.id}-plus-${lastAction.id}`,
          source: lastAction.id,
          target: `plus-${lastAction.id}`,
          type: 'smoothstep',
        })
      } else {
        // No action nodes - connect trigger to its plus node
        flowEdges.push({
          id: `trigger-plus-trigger`,
          source: triggerNode.id,
          target: 'plus-trigger',
          type: 'smoothstep',
        })
      }
    }

    return flowEdges
  }, [workflow?.nodes])

  // Update nodes and edges when workflow changes
  React.useEffect(() => {
    setNodes(reactFlowNodes)
    setEdges(reactFlowEdges)
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
    },
    [onNodesChange],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges],
  )

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const workflowNode = (workflow?.nodes ?? []).find((n) => n.id === node.id)
      if (!workflowNode) return

      if (workflowNode.type === 'trigger') {
        setTriggerDialog({
          isOpen: true,
          node: workflowNode,
        })
      } else if (workflowNode.type === 'action') {
        setActionDialog({
          isOpen: true,
          node: workflowNode,
        })
      }
    },
    [workflow?.nodes],
  )

  const handleTriggerSubmit = useCallback(
    (nodeData: Omit<WorkflowNode, 'id'>) => {
      if (!workflow) return
      if (triggerDialog.node) {
        const updatedNodes = workflow.nodes.map((node) =>
          node.id === triggerDialog.node!.id ? { ...node, ...nodeData } : node,
        )
        setWorkflow({
          ...workflow,
          nodes: updatedNodes,
        })
        void saveNodes(updatedNodes)
      }
    },
    [triggerDialog, workflow, setWorkflow, saveNodes],
  )

  const handleActionSubmit = useCallback(
    (nodeData: Omit<WorkflowNode, 'id'>) => {
      if (!workflow) return
      if (actionDialog.node) {
        const updatedNodes = workflow.nodes.map((node) =>
          node.id === actionDialog.node!.id ? { ...node, ...nodeData } : node,
        )
        setWorkflow({
          ...workflow,
          nodes: updatedNodes,
        })
        void saveNodes(updatedNodes)
      }
    },
    [actionDialog, workflow, setWorkflow, saveNodes],
  )

  const handleCreateNodeFromType = useCallback(
    (selectedType: string) => {
      if (!workflow) return

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
        inputMapping: {},
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
      setWorkflow({ ...workflow, nodes: updatedNodes })
      void saveNodes(updatedNodes)
    },
    [workflow, nodeTypeDefinitions, pendingAfterId, setWorkflow, saveNodes],
  )

  const handleCreateTriggerFromType = useCallback(
    (selectedType: string) => {
      if (!workflow) return
      const name = triggerTypes[selectedType]?.name ?? selectedType
      const newTrigger: WorkflowNode = {
        id: uuidv4(),
        name,
        type: 'trigger',
        triggerType: selectedType,
        inputMapping: {},
      }
      const updatedNodes = [...(workflow.nodes ?? [])]
      const existingIndex = updatedNodes.findIndex((n) => n.type === 'trigger')
      if (existingIndex >= 0) updatedNodes[existingIndex] = newTrigger
      else updatedNodes.unshift(newTrigger)
      setTriggerCreateDialogOpen(false)
      setWorkflow({ ...workflow, nodes: updatedNodes })
      void saveNodes(updatedNodes)
    },
    [workflow, triggerTypes, setWorkflow, saveNodes],
  )

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        defaultEdgeOptions={{ style: { strokeDasharray: '2 4', strokeLinecap: 'round', strokeWidth: 2.1 } }}
        fitView
        fitViewOptions={{ padding: 0.1, minZoom: 0.1, maxZoom: 1.5 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.1 }}
        className='bg-gray-50'
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {triggerDialog.node && (
        <EditTriggerDialog
          isOpen={triggerDialog.isOpen}
          onClose={() => setTriggerDialog({ isOpen: false })}
          onUpdateWorkflow={handleTriggerSubmit}
          node={triggerDialog.node}
          triggerTypes={triggerTypes}
        />
      )}

      {actionDialog.node && (
        <EditNodeDialog
          isOpen={actionDialog.isOpen}
          onClose={() => setActionDialog({ isOpen: false })}
          onSubmit={handleActionSubmit}
          node={actionDialog.node}
          nodeTypes={nodeTypeDefinitions}
        />
      )}

      <NodeCreateDialog
        isOpen={nodeCreateDialogOpen}
        onClose={() => {
          setNodeCreateDialogOpen(false)
          setPendingAfterId(undefined)
        }}
        nodeTypes={nodeTypeDefinitions}
        onCreate={handleCreateNodeFromType}
      />

      <TriggerCreateDialog
        isOpen={triggerCreateDialogOpen}
        onClose={() => setTriggerCreateDialogOpen(false)}
        triggerTypes={triggerTypes}
        onCreate={handleCreateTriggerFromType}
      />
    </>
  )
}

// Wrapper component with ReactFlowProvider
export function WorkflowEditorWrapper(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditor {...props} />
    </ReactFlowProvider>
  )
}
