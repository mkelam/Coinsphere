import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  "data-testid"?: string
}

export function GlassCard({ children, className, hover = true, onClick, "data-testid": dataTestId }: GlassCardProps) {
  return <div onClick={onClick} data-testid={dataTestId} className={cn("glass-card p-6", hover && "cursor-pointer", className)}>{children}</div>
}
