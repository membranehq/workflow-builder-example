"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useIntegrationApp } from "@integration-app/react"
import { TestResultDialog } from "./components/test-result-dialog"

export default function ActionsPage() {
  const router = useRouter()
  const integrationApp = useIntegrationApp()
  const [actions, setActions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [runningActionId, setRunningActionId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testError, setTestError] = useState<any>(null)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const response = await fetch("/api/actions")
        if (!response.ok) throw new Error("Failed to fetch actions")
        const data = await response.json()
        setActions(data)
      } catch (error) {
        console.error("Failed to fetch actions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActions()
  }, [])

  const handleRunAction = async (action: any) => {
    try {
      setRunningActionId(action._id)
      setTestError(null)
      
      const response = await integrationApp
        .connection(action.connectionId)
        .dataCollection(action.collectionKey, action.parameters || {})
        [action.method](action.input)

      setTestResult(response)
      setIsTestDialogOpen(true)
    } catch (error) {
      setTestError(error)
      setIsTestDialogOpen(true)
    } finally {
      setRunningActionId(null)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Actions
        </h1>
        <Button onClick={() => router.push("/actions/new")}>
          Add Action
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : actions.length === 0 ? (
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              No actions yet. Click "Add Action" to create one.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {actions.map((action) => (
              <div
                key={action._id}
                className="p-6 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {action.connectionId}
                  </div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {action.collectionKey} / {action.method}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleRunAction(action)}
                  disabled={runningActionId === action._id}
                >
                  {runningActionId === action._id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running...
                    </>
                  ) : (
                    'Run'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <TestResultDialog
        isOpen={isTestDialogOpen}
        onClose={() => {
          setIsTestDialogOpen(false)
          setTestResult(null)
          setTestError(null)
        }}
        result={testResult}
        error={testError}
      />
    </div>
  )
} 