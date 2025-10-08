import api from './api'

export interface Alert {
  id: string
  userId: string
  alertType: string
  tokenSymbol: string
  condition: string
  threshold: number
  isActive: boolean
  lastTriggered: string | null
  triggerCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateAlertRequest {
  alertType: string
  tokenSymbol: string
  condition: string
  threshold: number
}

export interface AlertsResponse {
  alerts: Alert[]
}

export interface CreateAlertResponse {
  alert: Alert
}

// Alerts API
export const alertsApi = {
  // Get all alerts for the authenticated user
  getAlerts: async (): Promise<AlertsResponse> => {
    const { data } = await api.get<AlertsResponse>('/alerts')
    return data
  },

  // Create a new alert
  createAlert: async (
    alert: CreateAlertRequest
  ): Promise<CreateAlertResponse> => {
    const { data } = await api.post<CreateAlertResponse>('/alerts', alert)
    return data
  },

  // Delete an alert
  deleteAlert: async (alertId: string): Promise<void> => {
    await api.delete(`/alerts/${alertId}`)
  },

  // Toggle alert active status
  toggleAlert: async (alertId: string): Promise<CreateAlertResponse> => {
    const { data } = await api.patch<CreateAlertResponse>(
      `/alerts/${alertId}/toggle`
    )
    return data
  },
}

export default alertsApi
