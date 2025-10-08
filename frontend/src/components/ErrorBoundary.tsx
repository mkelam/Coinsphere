import { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    window.location.href = "/"
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
          <Card className="glass-card max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
                <CardTitle className="text-2xl">Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/70">
                We're sorry, but something unexpected happened. Our team has been notified and is
                working on a fix.
              </p>

              {this.state.error && (
                <div className="p-4 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <p className="text-sm font-mono text-[#EF4444]">{this.state.error.toString()}</p>
                </div>
              )}

              {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                <details className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Stack trace (development only)
                  </summary>
                  <pre className="text-xs text-white/50 overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={this.handleReset} className="flex-1">
                  Return to Dashboard
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
