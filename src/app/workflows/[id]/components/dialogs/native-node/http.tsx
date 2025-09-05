import { Button } from '@/components/ui/button'
import { HttpNodeInput } from '@/lib/temporal/types'
import { HttpNodeData } from '../../types/workflow'
import { cn } from '@/lib/utils'

type HttpProps = HttpNodeData['configuration'] & {
  onChange: (data: HttpNodeData['configuration']) => void
}

const methods: HttpNodeInput['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']

// Reusable input components
const TextInput = ({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}) => (
  <input
    type='text'
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={cn(
      'rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2',
      className,
    )}
  />
)

const SelectInput = ({
  value,
  onChange,
  children,
  className,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  className?: string
}) => (
  <select
    value={value}
    onChange={onChange}
    className={cn(
      'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2',
      className,
    )}
  >
    {children}
  </select>
)

const DeleteButton = ({ onClick, className }: { onClick: () => void; className?: string }) => (
  <Button variant='outline' onClick={onClick} className={cn('px-2 py-1 text-xs', className)}>
    Delete
  </Button>
)

const SpacerDiv = ({ className }: { className?: string }) => (
  <div className={cn('px-2 py-1 text-xs h-8 w-16 flex items-center justify-center', className)} />
)

export const Http = ({ uri, method, headers, queryParameters, onChange }: HttpProps) => {
  // Ensure all values have defaults to prevent controlled/uncontrolled input warnings
  const safeUri = uri || ''
  const safeMethod = method || ''
  const safeHeaders = headers || {}
  const safeQueryParameters = queryParameters || []

  // Convert headers to array format for easier management
  const headersArray = Object.entries(safeHeaders)

  // Always ensure there's at least one empty header pair
  const displayHeaders = headersArray.length === 0 ? [['', '']] : [...headersArray, ['', '']]

  // Convert query parameters to array format for easier management
  const queryParamsArray = safeQueryParameters

  // Always ensure there's at least one empty query parameter pair
  const displayQueryParams =
    queryParamsArray.length === 0 ? [{ key: '', value: '' }] : [...queryParamsArray, { key: '', value: '' }]

  const updateHeader = (index: number, key: string, value: string) => {
    const newHeadersArray = [...displayHeaders]
    newHeadersArray[index] = [key, value]

    // Filter out empty pairs and convert back to object
    const filteredHeaders = newHeadersArray
      .filter(([k, v]) => k.trim() !== '' || v.trim() !== '')
      .reduce(
        (acc, [k, v]) => {
          if (k.trim() !== '') {
            acc[k] = v
          }
          return acc
        },
        {} as Record<string, string>,
      )

    onChange({
      uri: safeUri,
      headers: filteredHeaders,
      method: safeMethod as HttpNodeInput['method'],
      queryParameters: safeQueryParameters,
    })
  }

  const removeHeader = (index: number) => {
    const newHeadersArray = displayHeaders.filter((_, i) => i !== index)

    // If we removed the last non-empty header, ensure we have at least one empty pair
    const nonEmptyHeaders = newHeadersArray.filter(([k, v]) => k.trim() !== '' || v.trim() !== '')
    const finalHeaders = nonEmptyHeaders.length === 0 ? [['', '']] : newHeadersArray

    const filteredHeaders = finalHeaders
      .filter(([k, v]) => k.trim() !== '' || v.trim() !== '')
      .reduce(
        (acc, [k, v]) => {
          if (k.trim() !== '') {
            acc[k] = v
          }
          return acc
        },
        {} as Record<string, string>,
      )

    onChange({
      uri: safeUri,
      headers: filteredHeaders,
      method: safeMethod as HttpNodeInput['method'],
      queryParameters: safeQueryParameters,
    })
  }

  const updateQueryParam = (index: number, key: string, value: string) => {
    const newQueryParamsArray = [...displayQueryParams]
    newQueryParamsArray[index] = { key, value }

    // Filter out empty pairs
    const filteredQueryParams = newQueryParamsArray
      .filter(({ key: k, value: v }) => k.trim() !== '' || v.trim() !== '')
      .filter(({ key: k }) => k.trim() !== '') // Only include params with non-empty keys

    onChange({
      uri: safeUri,
      headers: safeHeaders,
      method: safeMethod as HttpNodeInput['method'],
      queryParameters: filteredQueryParams,
    })
  }

  const removeQueryParam = (index: number) => {
    const newQueryParamsArray = displayQueryParams.filter((_, i) => i !== index)

    // If we removed the last non-empty query param, ensure we have at least one empty pair
    const nonEmptyQueryParams = newQueryParamsArray.filter(({ key: k, value: v }) => k.trim() !== '' || v.trim() !== '')
    const finalQueryParams = nonEmptyQueryParams.length === 0 ? [{ key: '', value: '' }] : newQueryParamsArray

    const filteredQueryParams = finalQueryParams
      .filter(({ key: k, value: v }) => k.trim() !== '' || v.trim() !== '')
      .filter(({ key: k }) => k.trim() !== '') // Only include params with non-empty keys

    onChange({
      uri: safeUri,
      headers: safeHeaders,
      method: safeMethod as HttpNodeInput['method'],
      queryParameters: filteredQueryParams,
    })
  }

  return (
    <>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Method</label>
        <SelectInput
          value={safeMethod}
          onChange={(e) => {
            const method = e.target.value as HttpNodeInput['method']

            if (method) {
              onChange({ uri: safeUri, headers: safeHeaders, method, queryParameters: safeQueryParameters })
            }
          }}
        >
          <option key='no-method-selected' value=''>
            ---
          </option>
          {methods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </SelectInput>
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>URI</label>
        <TextInput
          value={safeUri}
          onChange={(e) =>
            onChange({
              uri: e.target.value,
              headers: safeHeaders,
              method: safeMethod as HttpNodeInput['method'],
              queryParameters: safeQueryParameters,
            })
          }
          className='w-full'
        />
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Headers</label>
        <div className='flex flex-col gap-2'>
          {displayHeaders.map(([key, value], index) => (
            <div key={index} className='flex items-center gap-2'>
              <div className='w-[80%] grid grid-cols-2 gap-2'>
                <TextInput placeholder='key' value={key} onChange={(e) => updateHeader(index, e.target.value, value)} />
                <TextInput
                  placeholder='value'
                  value={value}
                  onChange={(e) => updateHeader(index, key, e.target.value)}
                />
              </div>
              <div className='flex items-center'>
                {key.trim() !== '' || value.trim() !== '' ? (
                  <DeleteButton onClick={() => removeHeader(index)} />
                ) : (
                  <SpacerDiv />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Query Parameters</label>
        <div className='flex flex-col gap-2'>
          {displayQueryParams.map(({ key, value }, index) => (
            <div key={index} className='flex items-center gap-2'>
              <div className='w-[80%] grid grid-cols-2 gap-2'>
                <TextInput
                  placeholder='key'
                  value={key}
                  onChange={(e) => updateQueryParam(index, e.target.value, value)}
                />
                <TextInput
                  placeholder='value'
                  value={value}
                  onChange={(e) => updateQueryParam(index, key, e.target.value)}
                />
              </div>
              <div className='flex items-center'>
                {key.trim() !== '' || value.trim() !== '' ? (
                  <DeleteButton onClick={() => removeQueryParam(index)} />
                ) : (
                  <SpacerDiv />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
