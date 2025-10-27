import React, { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { GlobeIcon, Sparkles } from 'lucide-react'
import { useIntegrations } from '@membranehq/react'
import type { Integration } from '@membranehq/sdk'

interface NodeCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (selectedType: string, config?: Record<string, unknown>) => void
}

type NavOption = 'apps' | 'others'

export function NodeCreateDialog({ isOpen, onClose, onCreate }: NodeCreateDialogProps) {
  const [activeNav, setActiveNav] = useState<NavOption>('apps')
  const [searchTerm, setSearchTerm] = useState('')
  const { integrations } = useIntegrations()

  const handleIntegrationSelect = (integration: Integration) => {
    onCreate('action', { integrationKey: integration.key })
    onClose()
  }

  const handleHttpRequestSelect = () => {
    onCreate('http', {})
    onClose()
  }

  const handleAISelect = () => {
    onCreate('ai', {})
    onClose()
  }

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl h-[600px] p-0' hideClose>

        <div className='flex h-full'>
          {/* Left Navigation */}
          <div className='w-48 border-r bg-gray-50 p-4 rounded-l-lg'>
            <nav className='space-y-1'>
              <Button
                variant={activeNav === 'apps' ? 'secondary' : 'ghost'}
                className='w-full justify-start rounded-full'
                onClick={() => setActiveNav('apps')}
              >
                Apps
              </Button>
              <Button
                variant={activeNav === 'others' ? 'secondary' : 'ghost'}
                className='w-full justify-start rounded-full'
                onClick={() => setActiveNav('others')}
              >
                Others
              </Button>
            </nav>
          </div>

          {/* Right Content */}
          <div className='flex-1 p-4'>
            <ScrollArea className='h-full'>
              {activeNav === 'apps' && (
                <div className='space-y-4'>
                  {/* Search Bar */}
                  <div className='relative'>
                    <input
                      type='text'
                      placeholder='Search apps...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full px-3 py-2 pl-9 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent'
                    />
                    <svg
                      className='absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                    </svg>
                  </div>

                  {/* Your top apps section */}
                  <div>
                    <div className='grid grid-cols-4 gap-3'>
                      {filteredIntegrations.slice(0, 12).map((integration) => (
                        <button
                          key={integration.key}
                          onClick={() => handleIntegrationSelect(integration)}
                          className='flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors'
                        >
                          <div className='w-12 h-12 mb-2'>
                            {integration.logoUri ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={integration.logoUri}
                                alt={`${integration.name} logo`}
                                className='w-full h-full object-contain rounded'
                              />
                            ) : (
                              <div className='w-full h-full bg-gray-100 rounded flex items-center justify-center text-lg font-medium text-gray-600'>
                                {integration.name[0]}
                              </div>
                            )}
                          </div>
                          <span className='text-xs text-center text-gray-700 truncate w-full'>
                            {integration.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>


                </div>
              )}

              {activeNav === 'others' && (
                <div className='space-y-4'>
                  {/* HTTP Request option */}
                  <div>
                    <button
                      type='button'
                      onClick={handleHttpRequestSelect}
                      className='flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 text-left w-full'
                    >
                      <div className='w-12 h-12 flex items-center justify-center bg-blue-100 rounded'>
                        <GlobeIcon className='h-6 w-6 text-blue-600' />
                      </div>
                      <div>
                        <div className='text-sm font-medium'>HTTP Request</div>
                        <div className='text-xs text-muted-foreground'>
                          Make HTTP requests to external APIs or webhooks
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* AI option */}
                  <div>
                    <button
                      type='button'
                      onClick={handleAISelect}
                      className='flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 text-left w-full'
                    >
                      <div className='w-12 h-12 flex items-center justify-center bg-purple-100 rounded'>
                        <Sparkles className='h-6 w-6 text-purple-600' />
                      </div>
                      <div>
                        <div className='text-sm font-medium'>AI</div>
                        <div className='text-xs text-muted-foreground'>
                          Use AI to process data with custom instructions
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
