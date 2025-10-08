import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({ message = "Loading...", fullScreen = true }: LoadingScreenProps) {
  const containerClass = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-black z-50"
    : "flex items-center justify-center py-12"

  return (
    <div className={containerClass}>
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin mx-auto" />
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <Loader2 className={`animate-spin text-[#3B82F6] ${sizeMap[size]} ${className}`} />
  )
}
