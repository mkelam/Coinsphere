import { useState, useEffect, useRef } from "react"
import { Bell, User, LogOut, Settings, CreditCard, HelpCircle, LayoutDashboard, Wallet, Link2, Menu, X, ChevronDown, Layers } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Primary navigation items
  const primaryNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolios', path: '/portfolios', icon: Wallet },
    { name: 'DeFi', path: '/defi', icon: Layers },
    { name: 'Exchanges', path: '/exchanges', icon: Link2 },
    { name: 'Alerts', path: '/alerts', icon: Bell },
  ]

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false)
  }, [location.pathname])

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0E27]/30 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left Side - Hamburger + Logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Toggle - Top Left */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              aria-label="Toggle menu"
              aria-expanded={showMobileMenu}
              data-testid="hamburger-menu-button"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Logo - Clickable */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="Go to Dashboard"
            >
              <div className="text-2xl">🔮</div>
              <span className="text-xl font-semibold text-white">CoinSphere</span>
            </button>
          </div>

          {/* Primary Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryNav.map((item) => {
              const isActive = isActiveRoute(item.path)
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${isActive
                      ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.name}</span>
                </button>
              )
            })}
          </nav>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                  ${showUserMenu ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'}
                `}
                data-testid="user-menu-button"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 glass-card p-2 shadow-xl border border-white/10"
                  data-testid="user-menu-dropdown"
                >
                  {/* User Info */}
                  <div className="px-3 py-3 border-b border-white/10 mb-2">
                    <div className="text-sm font-medium text-white">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email}
                    </div>
                    <div className="text-xs text-white/50 mt-1">{user?.email}</div>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                        {user?.subscriptionTier === 'free' ? 'Free Plan' :
                         user?.subscriptionTier === 'plus' ? 'Plus Plan' :
                         user?.subscriptionTier === 'pro' ? 'Pro Plan' :
                         'Power Trader'}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate("/settings")
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors"
                    data-testid="settings-button"
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate("/billing")
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Billing & Payments
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate("/help")
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help & Support
                  </button>

                  {/* Upgrade CTA for free users */}
                  {user?.subscriptionTier === 'free' && (
                    <>
                      <div className="border-t border-white/10 my-2"></div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate("/pricing")
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg transition-colors font-medium"
                      >
                        <span className="text-lg">💎</span>
                        Upgrade to Plus
                      </button>
                    </>
                  )}

                  <div className="border-t border-white/10 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                    data-testid="logout-button"
                    aria-label="Logout"
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

      {/* Menu Drawer - Now visible on all screens */}
      {showMobileMenu && (
        <div className="absolute left-4 sm:left-6 lg:left-8 top-full mt-2 w-[570px] bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-lg shadow-xl z-50">
          <div className="px-4 py-4 space-y-1">
            {/* Primary Navigation - Mobile */}
            {primaryNav.map((item) => {
              const isActive = isActiveRoute(item.path)
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                    ${isActive
                      ? 'bg-[#3B82F6] text-white'
                      : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </button>
              )
            })}

            {/* User Section - Mobile */}
            <div className="border-t border-white/10 mt-4 pt-4">
              <div className="px-4 py-2 mb-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-medium">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email}
                    </div>
                    <div className="text-xs text-white/50">{user?.email}</div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                  {user?.subscriptionTier === 'free' ? 'Free Plan' :
                   user?.subscriptionTier === 'plus' ? 'Plus Plan' :
                   user?.subscriptionTier === 'pro' ? 'Pro Plan' :
                   'Power Trader'}
                </span>
              </div>

              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                Profile Settings
              </button>

              <button
                onClick={() => navigate("/billing")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Billing & Payments
              </button>

              <button
                onClick={() => navigate("/help")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                Help & Support
              </button>

              {user?.subscriptionTier === 'free' && (
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg transition-colors font-medium"
                >
                  <span className="text-lg">💎</span>
                  Upgrade to Plus
                </button>
              )}

              <div className="border-t border-white/10 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
