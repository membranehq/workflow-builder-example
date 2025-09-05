import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { WorkflowNode } from '@/lib/temporal/types'
import { useEffect, useState } from 'react'
import { Name } from './name'
import { NodeTypeSelector } from './node-type-selector'
import { Http } from './http'
import { Filter } from './filter'
import { NativeNodeData, HttpNodeData, FilterNodeData, NewNativeNodeData } from '../../types/workflow'
import { useNodeType } from '@/hooks/use-action-types'
import { DataInput } from '@membranehq/react'

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

  // Get node type configuration from API
  const { nodeType: nodeTypeConfig, isLoading: isLoadingNodeType } = useNodeType(formData.type as WorkflowNode['type'])

  useEffect(() => {
    if (mode === 'configure' && node) {
      setFormData(node)
    } else if (mode === 'create') {
      setFormData(initialFormData)
    }
  }, [mode, node])

  // Clear form data when dialog opens in create mode
  useEffect(() => {
    if (isOpen && mode === 'create') {
      setFormData(initialFormData)
    }
  }, [isOpen, mode])

  // Clear configuration when node type changes (but not on initial load)
  const [previousType, setPreviousType] = useState<string | null>(null)
  useEffect(() => {
    if (previousType && previousType !== formData.type && formData.type) {
      setFormData((prev) => ({ ...prev, configuration: {} }))
    }
    setPreviousType(formData.type)
  }, [formData.type, previousType])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='max-w-[800px] w-[800px] max-h-[90vh] flex flex-col p-0 overflow-auto'
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
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
                onChange={({ type }) => setFormData((prev) => ({ ...prev, type, configuration: {} }))}
              />

              {/* Use API-based configuration for all node types */}
              {formData.type && nodeTypeConfig && (
                <div className='space-y-4'>
                  <div className='border-t pt-4'>
                    <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>
                      {nodeTypeConfig.name} Configuration
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>{nodeTypeConfig.description}</p>
                    {isLoadingNodeType ? (
                      <div className='h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
                    ) : (
                      <div className='relative' style={{ isolation: 'isolate' }}>
                        <DataInput
                          schema={nodeTypeConfig.configurationSchema}
                          value={formData.configuration}
                          variablesSchema={{}}
                          onChange={(configuration) => setFormData((prev) => ({ ...prev, configuration }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback to hardcoded components for backward compatibility */}
              {formData.type === 'http' && !nodeTypeConfig && (
                <Http
                  {...(formData.configuration as HttpNodeData['configuration'])}
                  onChange={(configuration) => setFormData((prev) => ({ ...prev, configuration }))}
                />
              )}
              {formData.type === 'filter' && !nodeTypeConfig && (
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
                    onSubmit(formData as NativeNodeData)
                    // Reset form data after successful submission
                    setFormData(initialFormData)
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
