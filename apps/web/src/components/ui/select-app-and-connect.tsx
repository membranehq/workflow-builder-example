import React from 'react'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useIntegration, useIntegrations } from '@membranehq/react'
import Image from 'next/image'
import { useIntegrationConnection } from '@/hooks/use-integration-connection'

interface SelectAppAndConnectProps {
  selectedIntegrationKey?: string
  onIntegrationChange: (integrationKey: string) => void
  onConnectionChange?: () => void
  onConnectionStateChange?: (isConnected: boolean) => void
  className?: string
  showLabel?: boolean
  label?: string
  clearFieldsOnIntegrationChange?: string[]
}

export function SelectAppAndConnect({
  selectedIntegrationKey,
  onIntegrationChange,
  onConnectionChange,
  onConnectionStateChange,
  className = '',
  showLabel = true,
  label = 'App',
}: SelectAppAndConnectProps) {
  const { integration: selectedIntegration } = useIntegration(selectedIntegrationKey as string)
  const { integrations } = useIntegrations()

  // Integration connection hook
  const { data: connection, isLoading: isConnectionLoading, isConnecting, connect } = useIntegrationConnection({
    integrationKey: selectedIntegrationKey || '',
  })

  const isConnected = !!connection

  // Notify parent component about connection state changes
  React.useEffect(() => {
    onConnectionStateChange?.(isConnected)
  }, [isConnected, onConnectionStateChange])

  const handleConnect = () => {
    connect()
    onConnectionChange?.()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* App Selection Section */}
      {showLabel && <Label>{label} *</Label>}

      {selectedIntegrationKey && selectedIntegration ? (
        <div className='flex items-center justify-between p-3 border rounded-lg'>
          <div className='flex items-center gap-3'>
            {selectedIntegration.logoUri ? (
              <Image
                width={20}
                height={20}
                src={selectedIntegration.logoUri}
                alt={`${selectedIntegration.name} logo`}
                className='w-5 h-5 rounded'
              />
            ) : (
              <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                {selectedIntegration.name[0]}
              </div>
            )}
            <span className='text-sm font-medium'>{selectedIntegration.name}</span>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className="rounded-full">
                Change
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-80' align='end'>
              <div className='space-y-2'>
                <div className='text-sm font-medium'>Select an app</div>
                <div className='grid grid-cols-2 gap-2 max-h-60 overflow-y-auto'>
                  {integrations.slice(0, 20).map((integration) => (
                    <button
                      key={integration.key}
                      onClick={() => onIntegrationChange(integration.key || '')}
                      className='flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 text-left'
                    >
                      {integration.logoUri ? (
                        <Image
                          width={20}
                          height={20}
                          src={integration.logoUri}
                          alt={`${integration.name} logo`}
                          className='w-5 h-5 rounded'
                        />
                      ) : (
                        <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                          {integration.name[0]}
                        </div>
                      )}
                      <span className='text-sm truncate'>{integration.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <div className='flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'>
              <span className='text-sm font-medium text-gray-600'>Select an app</span>
              <Button variant='outline' size='sm' className="rounded-full">
                Select
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className='w-80' align='start'>
            <div className='space-y-2'>
              <div className='text-sm font-medium'>Select an app</div>
              <div className='grid grid-cols-2 gap-2 max-h-60 overflow-y-auto'>
                {integrations.slice(0, 20).map((integration) => (
                  <button
                    key={integration.key}
                    onClick={() => onIntegrationChange(integration.key || '')}
                    className='flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 text-left'
                  >
                    {integration.logoUri ? (
                      <Image
                        width={20}
                        height={20}
                        src={integration.logoUri}
                        alt={`${integration.name} logo`}
                        className='w-5 h-5 rounded'
                      />
                    ) : (
                      <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                        {integration.name[0]}
                      </div>
                    )}
                    <span className='text-sm truncate'>{integration.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Connection Status Section */}
      {selectedIntegrationKey && selectedIntegration && (
        <div className='space-y-2'>
          <Label>Account *</Label>
          {isConnectionLoading ? (
            <div className='flex items-center justify-between p-3 border rounded-lg'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-5 w-5 rounded' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
          ) : isConnected ? (
            <div className='flex items-center justify-between p-3 border rounded-lg'>
              <div className='flex items-center gap-3'>
                {selectedIntegration.logoUri ? (
                  <Image
                    width={20}
                    height={20}
                    src={selectedIntegration.logoUri}
                    alt={`${selectedIntegration.name} logo`}
                    className='w-5 h-5 rounded'
                  />
                ) : (
                  <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                    {selectedIntegration.name[0]}
                  </div>
                )}
                <span className='text-sm font-medium'>Connected to {selectedIntegration.name}</span>
              </div>
              <Button onClick={handleConnect} disabled={isConnecting} variant='outline' size='sm' className="rounded-full">
                {isConnecting ? 'Reconnecting...' : 'Reconnect'}
              </Button>
            </div>
          ) : (
            <div className='flex items-center justify-between p-3 border rounded-lg'>
              <div className='flex items-center gap-3'>
                {selectedIntegration.logoUri ? (
                  <Image
                    width={20}
                    height={20}
                    src={selectedIntegration.logoUri}
                    alt={`${selectedIntegration.name} logo`}
                    className='w-5 h-5 rounded'
                  />
                ) : (
                  <div className='w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                    {selectedIntegration.name[0]}
                  </div>
                )}
                <span className='text-sm font-medium'>Connect {selectedIntegration.name}</span>
              </div>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                variant='default'
                size='sm'
                className="rounded-full"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
