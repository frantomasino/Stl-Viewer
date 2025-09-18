"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, Upload, RotateCcw } from "lucide-react"
import { exportACL, importACL, resetACL, type ACL } from "@/lib/acl"
import { useToast } from "@/hooks/use-toast"

interface ImportExportACLProps {
  onACLChange: (acl: ACL) => void
}

export function ImportExportACL({ onACLChange }: ImportExportACLProps) {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleExport = () => {
    try {
      exportACL()
      toast({
        title: "ACL Exported",
        description: "Access control list has been downloaded as acl.json",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export ACL. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const newACL = await importACL(file)
      onACLChange(newACL)
      toast({
        title: "ACL Imported",
        description: "Access control list has been successfully imported",
      })
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import ACL",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleReset = () => {
    try {
      resetACL()
      onACLChange({})
      setShowResetDialog(false)
      toast({
        title: "ACL Reset",
        description: "All permissions have been cleared",
      })
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset ACL. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export ACL
        </Button>

        <Button onClick={handleImportClick} variant="outline" size="sm" disabled={isImporting}>
          <Upload className="h-4 w-4 mr-2" />
          {isImporting ? "Importing..." : "Import ACL"}
        </Button>

        <Button onClick={() => setShowResetDialog(true)} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset ACL
        </Button>
      </div>

      <Input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Access Control List</DialogTitle>
            <DialogDescription>
              This will permanently delete all user permissions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset ACL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
