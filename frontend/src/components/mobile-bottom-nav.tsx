/**
 * Mobile Bottom Navigation
 *
 * Fixed bottom navigation bar for mobile devices
 * Provides quick access to primary app sections
 */

import { useNavigate, useLocation } from "react-router-dom"
import { LayoutDashboard, Wallet, Layers, Link2, Bell } from "lucide-react"

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },
    {
      name: 'Portfolios',
      path: '/portfolios',
      icon: Wallet,
      label: 'Portfolios'
    },
    {
      name: 'DeFi',
      path: '/defi',
      icon: Layers,
      label: 'DeFi'
    },
    {
      name: 'Exchanges',
      path: '/exchanges',
      icon: Link2,
      label: 'Exchanges'
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: Bell,
      label: 'Alerts'
    },
  ]

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0A0E27]/95 border-t border-white/10 safe-area-bottom"
        role="navigation"
        aria-label="Mobile bottom navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.path)
            const Icon = item.icon

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[64px]
                  ${isActive
                    ? 'text-[#3B82F6] bg-[#3B82F6]/10'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/[0.05]'
                  }
                `}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                  aria-hidden="true"
                />
                <span className={`text-[10px] font-medium transition-all ${isActive ? 'font-semibold' : ''}`}>
                  {item.name}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="md:hidden h-16" aria-hidden="true" />
    </>
  )
}
