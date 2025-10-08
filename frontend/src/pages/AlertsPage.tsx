import { useState, useEffect } from "react"
import { Plus, Trash2, Bell, BellOff } from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { alertsApi, Alert } from "@/services/api"
import { LoadingSpinner } from "@/components/LoadingScreen"

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    alertType: "price",
    tokenSymbol: "BTC",
    condition: "above",
    threshold: "",
  })

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const { alerts: fetchedAlerts } = await alertsApi.getAlerts()
      setAlerts(fetchedAlerts)
    } catch (err) {
      console.error("Failed to fetch alerts:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { alert } = await alertsApi.createAlert({
        alertType: formData.alertType as "price" | "prediction" | "risk",
        tokenSymbol: formData.tokenSymbol,
        condition: formData.condition as "above" | "below" | "equal",
        threshold: parseFloat(formData.threshold),
      })
      setAlerts([...alerts, alert])
      setShowCreateForm(false)
      setFormData({ alertType: "price", tokenSymbol: "BTC", condition: "above", threshold: "" })
    } catch (err) {
      console.error("Failed to create alert:", err)
    }
  }

  const handleDeleteAlert = async (id: string) => {
    try {
      await alertsApi.deleteAlert(id)
      setAlerts(alerts.filter((a) => a.id !== id))
    } catch (err) {
      console.error("Failed to delete alert:", err)
    }
  }

  const handleToggleAlert = async (id: string) => {
    try {
      const { alert } = await alertsApi.toggleAlert(id)
      setAlerts(alerts.map((a) => (a.id === id ? alert : a)))
    } catch (err) {
      console.error("Failed to toggle alert:", err)
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "price":
        return "bg-[#3B82F6]"
      case "prediction":
        return "bg-[#10B981]"
      case "risk":
        return "bg-[#EF4444]"
      default:
        return "bg-white/20"
    }
  }

  const getConditionText = (condition: string) => {
    switch (condition) {
      case "above":
        return ">"
      case "below":
        return "<"
      case "equal":
        return "="
      default:
        return condition
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Alert Management</h1>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Alert
          </Button>
        </div>

        {showCreateForm && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle>Create New Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Alert Type</Label>
                    <select
                      value={formData.alertType}
                      onChange={(e) => setFormData({ ...formData, alertType: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                      <option value="price">Price Alert</option>
                      <option value="prediction">Prediction Alert</option>
                      <option value="risk">Risk Score Alert</option>
                    </select>
                  </div>

                  <div>
                    <Label>Token Symbol</Label>
                    <Input
                      value={formData.tokenSymbol}
                      onChange={(e) =>
                        setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })
                      }
                      placeholder="BTC, ETH, SOL..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Condition</Label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                      <option value="equal">Equal</option>
                    </select>
                  </div>

                  <div>
                    <Label>Threshold</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                      placeholder="45000.00"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Create Alert
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : alerts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Bell className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-4">No alerts configured yet</p>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="glass-card">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4 flex-1">
                    {alert.isActive ? (
                      <Bell className="w-5 h-5 text-[#3B82F6]" />
                    ) : (
                      <BellOff className="w-5 h-5 text-white/30" />
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getAlertTypeColor(alert.alertType)}>
                          {alert.alertType}
                        </Badge>
                        <span className="font-medium text-white">{alert.tokenSymbol}</span>
                      </div>
                      <p className="text-sm text-white/70">
                        Trigger when {alert.alertType} is {getConditionText(alert.condition)}{" "}
                        {alert.threshold}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={() => handleToggleAlert(alert.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-[#EF4444] hover:bg-[#EF4444]/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
