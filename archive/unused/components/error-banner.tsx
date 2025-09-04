"use client"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorInfo {
  id: string
  message: string
  timestamp: number
}

interface ErrorBannerProps {
  errors: ErrorInfo[]
  onRemoveError: (errorId: string) => void
}

export function ErrorBanner({ errors, onRemoveError }: ErrorBannerProps) {
  if (errors.length === 0) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-80 space-y-2">
      {errors.map((error) => (
        <div
          key={error.id}
          className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg animate-in slide-in-from-right-full"
        >
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-800 break-words">{error.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
              onClick={() => onRemoveError(error.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
