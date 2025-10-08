import { useState } from "react"
import { Bell, User, LogOut, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0E27]/30 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🔮</div>
            <span className="text-xl font-semibold">CoinSphere</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/alerts")}
              className="p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <User className="w-5 h-5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 glass-card p-2">
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <div className="text-sm font-medium text-white">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email}
                    </div>
                    <div className="text-xs text-white/50">{user?.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate("/settings")
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05] rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#EF4444] hover:bg-white/[0.05] rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
