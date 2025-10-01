import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WorkflowNode } from '../../types/workflow'
import { TriggerType } from '@/lib/node-types'
import { useState, useEffect } from 'react'
import { DataSchema } from '@membranehq/react'
import { NodeEditForm } from '../node-edit-form'
import { ManualTriggerConfig } from './manual-trigger-config'
import { EventTriggerConfig } from './event-trigger-config'

export interface TriggerDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateWorkflow: (node: Omit<WorkflowNode, 'id'>) => void
  node: WorkflowNode
  triggerTypes?: Record<string, TriggerType>
}

export function EditTriggerDialog({ isOpen, onClose, onUpdateWorkflow, node, triggerTypes = {} }: TriggerDialogProps) {
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState('manual')
  const [isSaving, setIsSaving] = useState(false)
  const [nodeState, setNodeState] = useState<Omit<WorkflowNode, 'id'>>(node)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && node) {
      setName(node.name)
      setSelectedType(node.triggerType || 'manual')
      setNodeState(node)
    }
  }, [isOpen, node])

  const handleSubmit = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      onUpdateWorkflow({
        ...nodeState,
        name: name.trim(),
        type: 'trigger',
        triggerType: selectedType,
      })

      onClose()
    } catch (error) {
      console.error('Failed to save trigger:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const availableTypes = Object.values(triggerTypes)
  const selectedTypeConfig = triggerTypes[selectedType]

  const handleNodeChange = (updatedNode: Omit<WorkflowNode, 'id'>) => {
    setNodeState(updatedNode)
    setName(updatedNode.name)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {(() => {
              const Icon = (triggerTypes[selectedType]?.icon as React.ComponentType<{ className?: string }>) || undefined
              return Icon ? <Icon className='h-4 w-4 text-gray-700' /> : null
            })()}
            Edit Trigger
          </DialogTitle>
          <DialogDescription>
            Modify the trigger settings for your workflow.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <NodeEditForm
            name={name}
            onNameChange={setName}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            availableTypes={availableTypes}
            typeLabel='Trigger Type'
            nameLabel='Name'
            namePlaceholder='Enter trigger name'
            disabled={isSaving}
          />
          {selectedTypeConfig && selectedType === 'manual' && (
            <ManualTriggerConfig
              value={nodeState}
              onChange={handleNodeChange}
            />
          )}

          {selectedTypeConfig && selectedType === 'event' && (
            <EventTriggerConfig
              value={nodeState}
              onChange={handleNodeChange}
              variableSchema={{} as DataSchema}
              triggerTypeConfig={selectedTypeConfig}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className='flex justify-end gap-3'>
          <Button variant='outline' onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSaving}>Update</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

