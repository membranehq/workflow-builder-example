import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useConnections, useIntegrationApp, useAction, IntegrationElementProvider, DataInput } from '@membranehq/react'
import type { NodeDialogProps, WorkflowNode, Action } from '../types/workflow'
import { getIntegrationName } from '../utils'

export function NodeDialog({ mode, node, open, onClose, onSubmit }: NodeDialogProps) {
  const { connections, loading: isLoadingConnections } = useConnections()
  const integrationApp = useIntegrationApp()
  const [actions, setActions] = useState<Action[]>([])
  const [isLoadingActions, setIsLoadingActions] = useState(false)
  const [formData, setFormData] = useState<Omit<WorkflowNode, 'id'>>({
    name: '',
    type: 'action',
    integrationKey: '',
    connectionId: '',
    flowKey: '',
    actionKey: '',
    inputMapping: {},
  })

  // Update useAction to use undefined instead of null
  const { action } = useAction(
    formData.actionKey && formData.integrationKey
      ? {
          key: formData.actionKey,
          integrationKey: formData.integrationKey,
        }
      : undefined,
  )
  // Add integrationOptions
  const integrationOptions =
    connections?.map((conn) => ({
      value: conn.id,
      label: conn.name || conn.integration?.key || '',
    })) || []

  // Add handleIntegrationChange
  const handleIntegrationChange = async (connectionId: string) => {
    const connection = connections?.find((conn) => conn.id === connectionId)
    const integrationKey = connection?.integration?.key || ''

    setFormData((prev) => ({
      ...prev,
      connectionId,
      integrationKey,
      actionKey: '',
    }))

    try {
      setIsLoadingActions(true)
      const actionsList = await integrationApp.integration(integrationKey).actions.list()

      setActions(actionsList.items)
    } catch (error) {
      console.error('Failed to load actions:', error)
    } finally {
      setIsLoadingActions(false)
    }
  }

  // Add handleActionChange
  const handleActionChange = (actionKey: string) => {
    setFormData((prev) => ({ ...prev, actionKey }))
    const action = actions.find((a) => a.key === actionKey)
    if (!formData.name && action) {
      setFormData((prev) => ({
        ...prev,
        actionKey,
        name: `${getIntegrationName(
          connections?.find((c) => c.id === prev.connectionId),
        )} ${action.name || action.key || 'Unknown Action'}`,
      }))
    }
  }

  // Initialize form data based on mode
  useEffect(() => {
    if (open) {
      setFormData(
        mode === 'configure' && node
          ? {
              name: node.name,
              type: node.type,
              integrationKey: node.integrationKey,
              connectionId: node.connectionId,
              flowKey: node.flowKey,
              actionKey: node.actionKey,
              inputMapping: node.inputMapping,
            }
          : {
              name: '',
              type: 'action',
              integrationKey: '',
              connectionId: '',
              flowKey: '',
              actionKey: '',
              inputMapping: {},
            },
      )
      setActions([])
    }
  }, [open, mode, node])

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Name</label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2'
                />
              </div>
              {mode === 'create' ? (
                <>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Integration</label>
                    <select
                      value={formData.connectionId}
                      onChange={(e) => handleIntegrationChange(e.target.value)}
                      className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2'
                      disabled={isLoadingConnections}
                    >
                      <option key='empty-integration' value=''>
                        Select Integration
                      </option>
                      {integrationOptions.map((option) => (
                        <option key={`integration-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Action</label>
                    <select
                      value={formData.actionKey}
                      onChange={(e) => handleActionChange(e.target.value)}
                      className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2'
                      disabled={isLoadingActions || !formData.connectionId}
                    >
                      <option key='empty-action' value=''>
                        Select Action
                      </option>
                      {actions.map((action) => (
                        <option key={`action-${action.key || 'unknown'}`} value={action.key || ''}>
                          {action.name || action.key || 'Unknown Action'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Collection Key</label>
                    <input
                      type='text'
                      value={formData.flowKey}
                      onChange={(e) => setFormData((prev) => ({ ...prev, flowKey: e.target.value }))}
                      className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2'
                      placeholder='Enter collection key (e.g., users, orders)'
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Integration</label>
                    <div className='p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-sm text-gray-500'>
                      {formData.integrationKey}
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Action</label>
                    <div className='p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-sm text-gray-500'>
                      {formData.actionKey}
                    </div>
                  </div>
                </>
              )}
              {action?.inputSchema && formData.connectionId && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Input Schema</label>

                  <IntegrationElementProvider
                    integrationId={formData.integrationKey}
                    connectionId={formData.connectionId}
                  >
                    <DataInput
                      schema={action?.inputSchema}
                      value={formData.inputMapping}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          inputMapping: value,
                        }))
                      }
                    />
                  </IntegrationElementProvider>
                </div>
              )}
            </div>
          </div>
          <div className='mt-auto border-t bg-white dark:bg-gray-950 p-6 relative '>
            <div className='flex justify-end space-x-2'>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => onSubmit(formData)}
                disabled={
                  !formData.name ||
                  (mode === 'create' && (!formData.connectionId || !formData.actionKey || !formData.flowKey))
                }
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
