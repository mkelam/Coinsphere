import { useState } from "react"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/glass-card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/AuthContext"

export function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile settings
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [portfolioUpdates, setPortfolioUpdates] = useState(true)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
        },
        body: JSON.stringify({ firstName, lastName, email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await response.json()

      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }))

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change password')
      }

      setMessage({ type: 'success', text: 'Password changed successfully! You will be logged out.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // User will be logged out due to token revocation, redirect after 2 seconds
      setTimeout(() => {
        localStorage.clear()
        window.location.href = '/login'
      }, 2000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Settings</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]'}`}>
            {message.text}
          </div>
        )}

        {/* Profile Settings */}
        <GlassCard hover={false} className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Profile Settings</h2>
          <p className="text-sm text-white/50 mb-6">Update your personal information</p>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white/70">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white/70">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="px-4 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </GlassCard>

        {/* Password Change */}
        <GlassCard hover={false} className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Change Password</h2>
          <p className="text-sm text-white/50 mb-6">Update your account password</p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-white/70">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white/70">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/70">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="px-4 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </GlassCard>

        {/* Notification Settings */}
        <GlassCard hover={false} className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Notification Settings</h2>
          <p className="text-sm text-white/50 mb-6">Manage your notification preferences</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-white font-medium">Email Notifications</Label>
                <p className="text-sm text-white/50">Receive email notifications</p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-0.5">
                <Label htmlFor="price-alerts" className="text-white font-medium">Price Alerts</Label>
                <p className="text-sm text-white/50">Get notified when price targets are hit</p>
              </div>
              <Switch
                id="price-alerts"
                checked={priceAlerts}
                onCheckedChange={setPriceAlerts}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="portfolio-updates" className="text-white font-medium">Portfolio Updates</Label>
                <p className="text-sm text-white/50">Daily portfolio performance summaries</p>
              </div>
              <Switch
                id="portfolio-updates"
                checked={portfolioUpdates}
                onCheckedChange={setPortfolioUpdates}
              />
            </div>
          </div>
        </GlassCard>

        {/* Account Information */}
        <GlassCard hover={false} className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Account Information</h2>
          <p className="text-sm text-white/50 mb-6">Your subscription and account details</p>

          <div className="space-y-4">
            <div className="flex justify-between pb-4 border-b border-white/10">
              <span className="text-sm text-white/50">Account Created</span>
              <span className="text-sm font-medium text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between pb-4 border-b border-white/10">
              <span className="text-sm text-white/50">Subscription Tier</span>
              <span className="text-sm font-medium text-white capitalize">
                {user?.subscriptionTier || 'free'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/50">Account ID</span>
              <span className="text-sm font-mono text-white">
                {user?.id?.slice(0, 8) || 'N/A'}...
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard hover={false} className="border-[#EF4444]/20">
          <h2 className="text-xl font-semibold text-[#EF4444] mb-2">Danger Zone</h2>
          <p className="text-sm text-white/50 mb-6">Irreversible actions</p>

          <div>
            <Button
              variant="destructive"
              disabled
              className="px-4 py-3 rounded-lg bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-medium transition-colors disabled:opacity-50"
            >
              Delete Account
            </Button>
            <p className="text-xs text-white/50 mt-2">
              This action is permanently disabled for safety. Contact support to delete your account.
            </p>
          </div>
        </GlassCard>
      </main>
    </div>
  )
}
