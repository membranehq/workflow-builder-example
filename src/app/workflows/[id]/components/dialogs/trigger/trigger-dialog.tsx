import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  useTriggerDialogState,
  useTriggerDialogData,
  useTriggerDialogActions,
  useTriggerDialogEffects,
  useTriggerDialogHandlers,
} from './trigger-dialog.hooks'
import { TriggerForm } from './trigger-dialog.components'
import { WorkflowNode } from '../../types/workflow'

export interface TriggerDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (node: Omit<WorkflowNode, 'id'>) => void
  node?: WorkflowNode
  mode?: 'create' | 'edit'
}

export function TriggerDialog({ isOpen, onClose, onSubmit, node, mode = 'create' }: TriggerDialogProps) {
  const { state, dispatch } = useTriggerDialogState()
  const { connections, integrationApp } = useTriggerDialogData()
  const { loadFlows, loadFlowParameters } = useTriggerDialogActions({ integrationApp, dispatch })

  useTriggerDialogEffects({ isOpen, mode, node, connections, state, dispatch, loadFlows, loadFlowParameters })

  const { handleIntegrationChange, handleTriggerChange, handleParameterChange, handleSubmit } =
    useTriggerDialogHandlers({
      mode,
      connections,
      state,
      dispatch,
      loadFlows,
      loadFlowParameters,
      integrationApp,
      node,
      onSubmit,
    })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-[800px] w-[800px] max-h-[90vh] flex flex-col p-0 overflow-auto'>
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle>{mode === 'edit' ? 'Edit Trigger' : 'Add Trigger'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Modify the trigger settings for your workflow.'
              : 'Configure a new trigger for your workflow.'}
          </DialogDescription>
        </DialogHeader>
        <div className='flex-1 overflow-y-auto p-6'>
          <TriggerForm
            state={state}
            connections={connections}
            onNameChange={(name) => dispatch({ type: 'NAME_CHANGED', payload: name })}
            onIntegrationChange={handleIntegrationChange}
            onFlowChange={handleTriggerChange}
            onParametersChange={handleParameterChange}
          />
        </div>
        <div className='flex justify-end gap-3 p-6 pt-0'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!state.name || !state.connection || !state.flow || state.isSaving}>
            {state.isSaving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Trigger'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
