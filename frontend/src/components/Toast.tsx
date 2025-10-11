import { useEffect } from "react"
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
      case "error":
        return <XCircle className="w-5 h-5 text-[#ef4444]" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-[#f59e0b]" />
      case "info":
        return <Info className="w-5 h-5 text-[#3b82f6]" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-[#10b981]/20 border-[#10b981]/30"
      case "error":
        return "bg-[#ef4444]/20 border-[#ef4444]/30"
      case "warning":
        return "bg-[#f59e0b]/20 border-[#f59e0b]/30"
      case "info":
        return "bg-[#3b82f6]/20 border-[#3b82f6]/30"
    }
  }

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border backdrop-blur-md ${getBackgroundColor()} shadow-lg animate-in slide-in-from-right duration-300`}
      data-testid={`toast-${type}`}
    >
      {getIcon()}
      <p className="flex-1 text-sm text-white">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded hover:bg-white/10 transition-colors"
        data-testid="toast-close"
      >
        <X className="w-4 h-4 text-white/70" />
      </button>
    </div>
  )
}
