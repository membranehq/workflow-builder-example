"use client"

import { useConnections } from "@integration-app/react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function NewActionPage() {
  const router = useRouter()
  const { items: connections } = useConnections()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          New Action
        </h1>
        <Button
          variant="ghost"
          onClick={() => router.push("/actions")}
        >
          Cancel
        </Button>
      </div>

      <div className="grid gap-4">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => router.push(`/actions/new/${connection.integration.key}/${connection.id}`)}
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
        ))}
      </div>
    </div>
  )
} 