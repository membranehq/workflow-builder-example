import React from 'react'
import useSWR from 'swr'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Minimizer } from '@/components/ui/minimizer'
import { authenticatedFetcher } from '@/lib/fetch-utils'
import { Action, DataInput, DataSchema } from '@membranehq/react'
import Image from 'next/image'
import { WorkflowNode } from '../types/workflow'

interface MembraneActionConfigProps {
  value: Omit<WorkflowNode, 'id'>
  onChange: (value: Omit<WorkflowNode, 'id'>) => void
  variableSchema: DataSchema
}

export function MembraneActionConfig({ value, onChange, variableSchema }: MembraneActionConfigProps) {
  const { data: membraneActionsData, isLoading } = useSWR<{
    actions: Action[]
  }>('/api/membrane/actions', authenticatedFetcher)

  const membraneActions = membraneActionsData?.actions?.filter((action) => action.integration) || []
  const selectedActionId = value.config?.actionId

  // Fetch detailed action data when an action is selected
  const { data: selectedActionData, isLoading: isLoadingSelectedAction } = useSWR<{
    action: Action
  }>(selectedActionId ? `/api/membrane/actions/${selectedActionId}` : null, authenticatedFetcher)

  const selectedAction = selectedActionData?.action

  return (
    <>
      <div className='space-y-2 border-t pt-4'>
        <Label>Action</Label>
        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-10 w-full' />
          </div>
        ) : (
          <div className='space-y-2'>
            <Select
              value={selectedActionId as string}
              onValueChange={(actionId) => {
                onChange({ ...value, config: { ...value.config, actionId } })
              }}
            >
              <SelectTrigger aria-label='Select action'>
                <div className='flex items-center gap-2'>
                  {(() => {
                    const selectedActionData = membraneActions.find((a) => a.id === selectedActionId)
                    return selectedActionData?.integration?.logoUri ? (
                      <Image
                        width={16}
                        height={16}
                        src={selectedActionData.integration.logoUri}
                        alt='Integration logo'
                        className='w-4 h-4 rounded'
                      />
                    ) : null
                  })()}
                  <span>{membraneActions.find((a) => a.id === selectedActionId)?.name || 'Select an action'}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {membraneActions.map((action) => (
                  <SelectItem key={action.id} value={action.id}>
                    <div className='flex items-center gap-2'>
                      {action.integration?.logoUri ? (
                        <Image
                          width={16}
                          height={16}
                          src={action.integration.logoUri}
                          alt='Integration logo'
                          className='w-4 h-4 rounded'
                        />
                      ) : null}
                      <span>{action.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Always render the action configuration section to prevent layout jumps */}
      <div className='space-y-2 border-t pt-4'>
        {!selectedActionId ? (
          /* Show placeholder when no action is selected */
          <div className='text-sm text-muted-foreground'>
            Select an action above to configure it
          </div>
        ) : isLoadingSelectedAction ? (
          /* Show compact skeleton while loading selected action */
          <div className='space-y-3'>
            <Skeleton className='h-5 w-44' />
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-5 w-36 mt-2' />
            <Skeleton className='h-16 w-full' />
          </div>
        ) : selectedAction ? (
          /* Show actual content when loaded */
          <>
            <Minimizer title="Configure Action Input" defaultOpen={true}>
              <DataInput
                schema={selectedAction?.inputSchema}
                value={value.inputMapping}
                variablesSchema={variableSchema}
                onChange={(configuration) => {
                  onChange({ ...value, inputMapping: configuration })
                }}
              />
            </Minimizer>

            <Minimizer title="Output Schema" defaultOpen={false} className="mt-4">
              <div className='h-40 overflow-y-auto border rounded-md p-2 w-full'>
                <pre className='text-xs'>{JSON.stringify(selectedAction?.outputSchema, null, 2)}</pre>
              </div>
            </Minimizer>
          </>
        ) : (
          /* Show error state */
          <div className='text-sm text-muted-foreground'>Failed to load action details</div>
        )}
      </div>
    </>
  )
}

export default MembraneActionConfig
