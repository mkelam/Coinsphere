/**
 * Layout Component
 *
 * Provides consistent layout across authenticated pages
 * Includes header + mobile bottom navigation
 */

import { ReactNode } from "react"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useLocation } from "react-router-dom"

interface LayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export function Layout({ children, showBottomNav = true }: LayoutProps) {
  const location = useLocation()

  // Don't show bottom nav on login/signup/pricing pages
  const hideBottomNavRoutes = ['/login', '/signup', '/pricing', '/onboarding']
  const shouldShowBottomNav = showBottomNav && !hideBottomNavRoutes.includes(location.pathname)

  return (
    <>
      <div className="min-h-screen bg-transparent pb-safe">
        {children}
      </div>
      {shouldShowBottomNav && <MobileBottomNav />}
    </>
  )
}
