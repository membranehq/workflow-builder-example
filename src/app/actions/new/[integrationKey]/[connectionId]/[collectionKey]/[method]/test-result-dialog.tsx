"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { JsonViewer } from "@/components/ui/json-viewer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { XCircle } from "lucide-react"

interface TestResultDialogProps {
  isOpen: boolean
  onClose: () => void
  result?: any
  error?: any
}

export function TestResultDialog({ isOpen, onClose, result, error }: TestResultDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className={error ? "text-red-600 dark:text-red-400" : ""}>
              {error ? "Error" : "Test Run Result"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 mt-4">
          <ScrollArea className="h-[calc(85vh-8rem)]">
            {error ? (
              <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-red-600 dark:text-red-400">
                    {error instanceof Error ? error.name : "Error"}
                  </div>
                  <div className="mt-1 text-red-600 dark:text-red-400 font-mono text-sm">
                    {error instanceof Error ? error.message : String(error)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <JsonViewer data={result} />
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
} 