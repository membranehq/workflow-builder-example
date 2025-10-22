import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { NodeTypeMetadata, TriggerType } from '@/lib/node-types'

interface NodeEditFormProps {
  name: string
  onNameChange: (name: string) => void
  selectedType: string
  onTypeChange: (type: string) => void
  availableTypes: Array<NodeTypeMetadata | TriggerType>
  typeLabel?: string
  nameLabel?: string
  namePlaceholder?: string
  disabled?: boolean
}

export function NodeEditForm({
  name,
  onNameChange,
  selectedType,
  onTypeChange,
  availableTypes,
  typeLabel = 'Type',
  nameLabel = 'Name',
  namePlaceholder = 'Enter name',
  disabled = false,
}: NodeEditFormProps) {
  const selectedTypeConfig = availableTypes.find(type => type.type === selectedType)

  return (
    <div className='space-y-4'>
      {/* Name Input */}
      <div className='space-y-2'>
        <Label htmlFor='name'>
          {nameLabel} <span className='text-red-500'>*</span>
        </Label>
        <Input
          id='name'
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={namePlaceholder}
          required
          disabled={disabled}
        />
      </div>

      {/* Type Selector */}
      {availableTypes.length > 0 && (
        <div className='space-y-2'>
          <Label htmlFor='type'>
            {typeLabel} <span className='text-red-500'>*</span>
          </Label>
          <Select value={selectedType} onValueChange={onTypeChange} disabled={disabled}>
            <SelectTrigger aria-label={`Select ${typeLabel.toLowerCase()}`}>
              <div className='flex items-center gap-2'>
                {(() => {
                  const Icon = selectedTypeConfig?.icon as React.ComponentType<{ className?: string }>
                  return Icon ? <Icon className='h-4 w-4 text-gray-700' /> : null
                })()}
                <span>{selectedTypeConfig?.name || `Select ${typeLabel.toLowerCase()}`}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type) => {
                const Icon = type.icon as React.ComponentType<{ className?: string }>
                return (
                  <SelectItem key={type.type} value={type.type}>
                    <div className='flex items-center gap-2'>
                      {Icon ? <Icon className='h-4 w-4 text-gray-700' /> : null}
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
