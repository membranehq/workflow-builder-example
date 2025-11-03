'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'

export function AuthTest() {
  const { user } = useAuth()
  const [nameInput, setNameInput] = useState('')

  return (
    <div className='p-4 bg-gray-100 dark:bg-gray-800 rounded-xl space-y-4'>
      <div>
        <h2 className='text-lg font-semibold mb-2'>Test Customer</h2>
        <p className='text-sm text-gray-600 dark:text-gray-400 italic mb-4'>
          This customer id and name will be used to connect external apps and run integrations.
        </p>
        <p className='font-mono text-sm'>Customer ID: {user?.id || 'Loading...'}</p>
        <p>Name: {user?.email || 'Not set'}</p>
      </div>

      <div className='flex gap-2'>
        <Input
          type='text'
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder='Enter customer name'
          className='w-64'
        />

      </div>
    </div>
  )
}
