import { RefreshCw, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RefreshWeb({
  onRefresh,
  loading = false,
}: {
  onRefresh: () => void
  loading?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onRefresh}
        variant="outline"
        size="sm"
        title="Refrescar datos"
        disabled={loading}
      >
        <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
      </Button>
      {loading && <span className="text-xs text-muted-foreground">Refrescando...</span>}
    </div>
  )
}