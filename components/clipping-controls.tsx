"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ClippingControlsProps {
  clippingEnabled: boolean
  theme: { isDark: boolean }
  onToggleClipping: () => void
}

export function ClippingControls({ clippingEnabled, theme, onToggleClipping }: ClippingControlsProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${theme?.isDark ? "text-white" : "text-gray-900"}`}>Interactive Clipping</h3>
        <Button variant="outline" size="sm" onClick={onToggleClipping}>
          {clippingEnabled ? "Hide Box" : "Show Box"}
        </Button>
      </div>

      {clippingEnabled && (
        <Card className={`p-3 ${theme?.isDark ? "bg-gray-700 border-gray-600" : ""}`}>
          <div className="text-sm text-center">
            <p className={`${theme?.isDark ? "text-gray-300" : "text-gray-600"}`}>Interactive clipping box is active</p>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className={theme?.isDark ? "text-gray-400" : "text-gray-500"}>X-axis handles</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className={theme?.isDark ? "text-gray-400" : "text-gray-500"}>Y-axis handles</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className={theme?.isDark ? "text-gray-400" : "text-gray-500"}>Z-axis handles</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
