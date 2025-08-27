"use client"

import { useConnections, useIntegrationApp, DataInput} from "@integration-app/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
interface AddActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}


export function AddActionDialog({ open, onOpenChange }: AddActionDialogProps) {
  const { items: connections } = useConnections()
  const integrationApp = useIntegrationApp()
  const [selectedConnection, setSelectedConnection] = useState<any>(null)
  const [dataCollections, setDataCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState<any>(null)
  const [collectionSpec, setCollectionSpec] = useState<any>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)
  const [isLoadingSpec, setIsLoadingSpec] = useState(false)


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
        fields : collectionSpec?.fieldsSchema
      }
    }
  },
  "update": {
    inputSchema: {
      type: "object",
      properties: {
        fields : collectionSpec?.fieldsSchema
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
  "search" : {
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

  const handleSelectConnection = async (connection: any) => {
    try {
      setSelectedConnection(connection)
      setIsLoadingCollections(true)
      const collections = await integrationApp
        .integration(connection.integration.key)
        .getDataCollections()
      setDataCollections(collections)
    } catch (error) {
      console.error("Failed to fetch collections:", error)
    } finally {
      setIsLoadingCollections(false)
    }
  }

  const handleSelectCollection = async (collection: any) => {
    try {
      setSelectedCollection(collection)
      setIsLoadingSpec(true)
      const spec = await integrationApp
        .integration(selectedConnection.integration.key)
        .getDataCollection(collection.key)
      setCollectionSpec(spec)
    } catch (error) {
      console.error("Failed to fetch collection spec:", error)
    } finally {
      setIsLoadingSpec(false)
    }
  }

  const handleSelectMethod = (methodKey: string) => {
    setSelectedMethod(methodKey)
  }

  const handleBack = () => {
    if (selectedMethod) {
      setSelectedMethod(null)
    } else if (selectedCollection) {
      setSelectedCollection(null)
      setCollectionSpec(null)
    } else {
      setSelectedConnection(null)
      setDataCollections([])
    }
  }

  const getDialogTitle = () => {
    if (selectedMethod) {
      return `${selectedConnection.name} ${selectedCollection.name} | ${selectedMethod} Configuration`
    }
    if (selectedCollection) {
      return `${selectedConnection.name} ${selectedCollection.name}`
    }
    if (selectedConnection) {
      return `${selectedConnection.name} Collections`
    }
    return "Select Integration"
  }

  const renderMethodSpec = () => {
    const methodSpec = METHODS[selectedMethod as keyof typeof METHODS]
    return (
      <div className="space-y-4 relative">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Input:
          </h3>
          <div className="relative z-50">
            <DataInput
              schema={methodSpec.inputSchema}
              value={{}}
              variablesSchema={{}}
              onChange={(importValue: unknown) => console.log(importValue)}
            />
          </div>
        </div>
        
      </div>
    )
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedConnection(null)
          setDataCollections([])
          setSelectedCollection(null)
          setCollectionSpec(null)
          setSelectedMethod(null)
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col relative z-50">
        <DialogHeader>
          <DialogTitle>
            {(selectedConnection || selectedCollection || selectedMethod) && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2"
                  onClick={handleBack}
                >
                  ←
                </Button>
                {getDialogTitle()}
              </div>
            )}
            {!selectedConnection && "Select Integration"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 mt-4 overflow-y-auto pr-2 relative">
          {selectedMethod ? (
            renderMethodSpec()
          ) : selectedCollection ? (
            isLoadingSpec ? (
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(collectionSpec)
                  .filter(key => Object.keys(METHODS).includes(key))
                  .map((method) => (
                    <div
                      key={method}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => handleSelectMethod(method)}
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
            )
          ) : selectedConnection ? (
            isLoadingCollections ? (
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ) : (
              dataCollections.map((collection) => (
                <div
                  key={collection.key}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => handleSelectCollection(collection)}
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {collection.name}
                    </h3>
                  </div>
                  <Button variant="ghost" size="sm">
                    Select →
                  </Button>
                </div>
              ))
            )
          ) : (
            connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => handleSelectConnection(connection)}
              >
                <div className="flex items-center space-x-4">
                  {connection?.integration?.logoUri ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={connection?.integration?.logoUri}
                      alt={`${connection?.name} logo`}
                      className="w-10 h-10 rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-medium text-gray-600 dark:text-gray-300">
                      {connection.name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {connection.name}
                    </h3>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Select →
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 