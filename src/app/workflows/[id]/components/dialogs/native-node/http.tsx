import { HttpMethod } from '@/lib/temporal/types'
import { HttpNodeData } from '@/lib/temporal/types'
import { DataInput } from '@membranehq/react'

type HttpProps = HttpNodeData['configuration'] & {
  onChange: (data: HttpNodeData['configuration']) => void
}

// HTTP configuration schema for DataInput
const httpConfigurationSchema = {
  type: 'object',
  properties: {
    uri: {
      type: 'string',
      description: 'The URL to make the request to',
    },
    method: {
      type: 'string',
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      description: 'HTTP method to use for the request',
    },
    headers: {
      type: 'object',
      additionalProperties: { type: 'string' },
      description: 'HTTP headers to include in the request',
    },
    queryParameters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
        },
      },
      description: 'Query parameters to append to the URL',
    },
  },
  required: ['uri', 'method'],
}

export const Http = ({ uri, method, headers, queryParameters, onChange }: HttpProps) => {
  // Convert the current configuration to the format expected by DataInput
  const currentConfig = {
    uri: uri || '',
    method: method || '',
    headers: headers || {},
    queryParameters: queryParameters || [],
  }

  return (
    <div className='space-y-4'>
      <div className='relative' style={{ isolation: 'isolate' }}>
        <DataInput
          schema={httpConfigurationSchema}
          value={currentConfig}
          variablesSchema={{}}
          onChange={(newConfig) => {
            onChange({
              uri: newConfig.uri || '',
              method: newConfig.method as HttpMethod,
              headers: newConfig.headers || {},
              queryParameters: newConfig.queryParameters || [],
            })
          }}
        />
      </div>
    </div>
  )
}
