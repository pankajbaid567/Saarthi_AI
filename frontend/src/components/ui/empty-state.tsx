import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="max-w-[420px] space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="pt-4">
            <Button onClick={action.onClick}>{action.label}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
