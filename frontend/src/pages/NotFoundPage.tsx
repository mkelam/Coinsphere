import { useNavigate } from "react-router-dom"
import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <Card className="glass-card max-w-lg w-full text-center">
        <CardHeader>
          <div className="text-6xl font-bold text-[#3B82F6] mb-4">404</div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-white/70">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
