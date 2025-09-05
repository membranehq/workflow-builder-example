import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { WorkflowNode } from '@/lib/temporal/types'
import { useEffect, useState } from 'react'
import { Name } from './name'
import { NodeTypeSelector } from './node-type-selector'
import { Http } from './http'
import { Filter } from './filter'
import { NativeNodeData, HttpNodeData, FilterNodeData, NewNativeNodeData } from '../../types/workflow'

type NativeNodeDialogProps =
  | {
      isOpen: boolean
      mode: 'create'
      onClose: () => void
      onSubmit: (nodeData: NewNativeNodeData) => void
      node?: undefined
    }
  | {
      isOpen: boolean
      mode: 'configure'
      onClose: () => void
      onSubmit: (nodeData: NativeNodeData) => void
      node: NativeNodeData
    }

const initialFormData: NewNativeNodeData = {
  name: '',
  type: '' as WorkflowNode['type'], // Need to hack for not selected option,
  configuration: {},
}

export const NativeNodeDialog = ({ isOpen, mode, node, onClose, onSubmit }: NativeNodeDialogProps) => {
  const [formData, setFormData] = useState<NewNativeNodeData | NativeNodeData>(initialFormData)

  useEffect(() => {
    if (mode === 'configure' && node) {
      setFormData(node)
    }
  }, [mode, node])

  console.log(formData)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        setFormData(initialFormData)
        onClose()
      }}
    >
      <DialogContent className='max-w-[800px] w-[800px] max-h-[90vh] flex flex-col p-0 overflow-auto'>
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle>{mode === 'configure' ? 'Edit Node' : 'Add Node'}</DialogTitle>
          <DialogDescription>
            {mode === 'configure'
              ? 'Modify the settings for this workflow node.'
              : 'Configure a new node for your workflow.'}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className='flex-1 overflow-y-auto px-6 relative z-0'>
            <div className='grid gap-4 py-4'>
              <Name name={formData.name} onChange={({ name }) => setFormData((prev) => ({ ...prev, name }))} />
              <NodeTypeSelector
                type={formData.type}
                onChange={({ type }) => setFormData((prev) => ({ ...prev, type }))}
              />
              {formData.type === 'http' && (
                <Http
                  {...(formData.configuration as HttpNodeData['configuration'])}
                  onChange={(configuration) => setFormData((prev) => ({ ...prev, configuration }))}
                />
              )}
              {formData.type === 'filter' && (
                <Filter
                  {...(formData.configuration as FilterNodeData['configuration'])}
                  onChange={(configuration) => setFormData((prev) => ({ ...prev, configuration }))}
                />
              )}
            </div>
          </div>
          <div className='mt-auto border-t bg-white dark:bg-gray-950 p-6 relative '>
            <div className='flex justify-end space-x-2'>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (formData.type) {
                    return onSubmit(formData as NativeNodeData)
                  }
                }}
                disabled={!formData.name || !formData.type}
              >
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
