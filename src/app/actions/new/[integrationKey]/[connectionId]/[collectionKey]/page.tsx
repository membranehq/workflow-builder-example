"use client"

import { useIntegrationApp } from "@integration-app/react"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"

const METHODS = {
  "list": {
    inputSchema: {
      type: "object",
      properties: {
        cursor: {
          type: "string",
        }
      }
    }
  },
  "create": {
    inputSchema: {
      type: "object",
      properties: {
        fields: {} // Will be populated with collection fields schema
      }
    }
  },
  "update": {
    inputSchema: {
      type: "object",
      properties: {
        fields: {} // Will be populated with collection fields schema
      }
    }
  },
  "delete": {
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      }
    }
  },
  "search": {
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        cursor: { type: "string" }
      }
    }
  },
  "find-by-id": {
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      }
    }
  }
}

export default function SelectMethodPage() {
  const router = useRouter()
  const { integrationKey, connectionId, collectionKey } = useParams()
  const integrationApp = useIntegrationApp()
  const [collectionSpec, setCollectionSpec] = useState<any>(null)
  const [connection, setConnection] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [spec, conn] = await Promise.all([
          integrationApp
            .integration(integrationKey as string)
            .getDataCollection(collectionKey as string),
          integrationApp
            .connection(connectionId as string)
            .get()
        ])
        setCollectionSpec(spec)
        setConnection(conn)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [integrationKey, collectionKey, connectionId, integrationApp])

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {connection?.integration?.logoUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={connection.integration.logoUri}
                alt={`${connection.integration.name} logo`}
                className="w-10 h-10 rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-medium text-gray-600 dark:text-gray-300">
                {connection?.integration?.name?.[0]}
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {connection?.name}
              </div>
              <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <span className="font-medium">{collectionSpec?.name}</span>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>

      <div className="grid gap-4">
        {Object.keys(collectionSpec)
          .filter(key => Object.keys(METHODS).includes(key))
          .map((method) => (
            <div
              key={method}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => router.push(`/actions/new/${integrationKey}/${connectionId}/${collectionKey}/${method}`)}
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {method}
                </h3>
              </div>
              <Button variant="ghost" size="sm">
                Select →
              </Button>
            </div>
          ))}
      </div>
    </div>
  )
} 