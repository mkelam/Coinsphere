import { useState } from "react"
import { Bell, User, Settings, LogOut, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { GlassCard } from "@/components/glass-card"

export function ComponentShowcase() {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0E27]/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🔮</div>
              <span className="text-xl font-semibold">CoinSphere Design System</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="text-6xl mb-4">🔮</div>
          <h1 className="text-4xl font-bold text-white mb-2">Component Showcase</h1>
          <p className="text-xl text-white/70">Coinsphere Design System - Glassmorphism Theme</p>
        </div>

        {/* Color Palette */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🎨 Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Accent Colors */}
            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-3">Accent Colors</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#3b82f6]"></div>
                  <div>
                    <div className="text-white font-medium">Accent Blue</div>
                    <div className="text-white/50 text-sm">#3b82f6</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#10b981]"></div>
                  <div>
                    <div className="text-white font-medium">Accent Green</div>
                    <div className="text-white/50 text-sm">#10b981</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#ef4444]"></div>
                  <div>
                    <div className="text-white font-medium">Accent Red</div>
                    <div className="text-white/50 text-sm">#ef4444</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Colors */}
            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-3">Background Colors</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#000000] border border-white/20"></div>
                  <div>
                    <div className="text-white font-medium">Primary BG</div>
                    <div className="text-white/50 text-sm">#000000</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/[0.05] border border-white/20"></div>
                  <div>
                    <div className="text-white font-medium">Glass BG</div>
                    <div className="text-white/50 text-sm">rgba(255,255,255,0.05)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/[0.10] border border-white/20"></div>
                  <div>
                    <div className="text-white font-medium">Glass Hover</div>
                    <div className="text-white/50 text-sm">rgba(255,255,255,0.10)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Colors */}
            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-3">Text Colors</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-white/20"></div>
                  <div>
                    <div className="text-white font-medium">Primary Text</div>
                    <div className="text-white/50 text-sm">100% opacity</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/70 border border-white/20"></div>
                  <div>
                    <div className="text-white font-medium">Secondary Text</div>
                    <div className="text-white/50 text-sm">70% opacity</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/50 border border-white/20"></div>
                  <div>
                    <div className="text-white font-medium">Tertiary Text</div>
                    <div className="text-white/50 text-sm">50% opacity</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Typography */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">✍️ Typography</h2>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-white">Heading 1 - 4xl Bold</h1>
              <p className="text-white/50 text-sm">text-4xl font-bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Heading 2 - 3xl Bold</h2>
              <p className="text-white/50 text-sm">text-3xl font-bold</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">Heading 3 - 2xl Semibold</h3>
              <p className="text-white/50 text-sm">text-2xl font-semibold</p>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white">Heading 4 - xl Semibold</h4>
              <p className="text-white/50 text-sm">text-xl font-semibold</p>
            </div>
            <div>
              <p className="text-base text-white/70">Body Text - Base Regular (This is standard body text with 70% opacity)</p>
              <p className="text-white/50 text-sm">text-base text-white/70</p>
            </div>
            <div>
              <p className="text-sm text-white/70">Small Text - sm Regular</p>
              <p className="text-white/50 text-sm">text-sm text-white/70</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Extra Small - xs 50% opacity</p>
              <p className="text-white/50 text-sm">text-xs text-white/50</p>
            </div>
          </div>
        </GlassCard>

        {/* Buttons */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🔘 Buttons</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-3">Primary Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <button className="px-4 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors">
                  Primary Button
                </button>
                <button className="px-4 py-3 rounded-lg bg-[#10b981] hover:bg-[#10b981]/90 text-white font-medium transition-colors">
                  Success Button
                </button>
                <button className="px-4 py-3 rounded-lg bg-[#ef4444] hover:bg-[#ef4444]/90 text-white font-medium transition-colors">
                  Danger Button
                </button>
                <button className="px-4 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  Disabled Button
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-3">Glass Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <button className="px-4 py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-white font-medium transition-colors">
                  Glass Button
                </button>
                <button className="px-4 py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-white/70 font-medium transition-colors">
                  Secondary Glass
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-3">Icon Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors" aria-label="Notifications">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors" aria-label="User menu">
                  <User className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors" aria-label="Settings">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Input Fields */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">📝 Input Fields</h2>
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Text Area</label>
              <textarea
                className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all h-24 resize-none"
                placeholder="Enter your message..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showcase-checkbox"
                className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-[#3b82f6] focus:ring-white/20 focus:ring-2"
              />
              <label htmlFor="showcase-checkbox" className="text-sm text-white/70">
                Remember me
              </label>
            </div>
          </div>
        </GlassCard>

        {/* Glass Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">💎 Glass Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
              <div className="text-sm text-white/50 mb-1">Total Portfolio Value</div>
              <div className="text-3xl font-bold text-white mb-2">$125,420.50</div>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+5.23%</span>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-sm text-white/50 mb-1">24h Change</div>
              <div className="text-3xl font-bold text-white mb-2">$6,543.21</div>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+2.18%</span>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-sm text-white/50 mb-1">Total Assets</div>
              <div className="text-3xl font-bold text-white mb-2">12</div>
              <div className="text-sm text-white/50">Across 3 exchanges</div>
            </GlassCard>
          </div>
        </div>

        {/* Notifications/Alerts */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🔔 Alerts & Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
              <CheckCircle className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-white">Success</div>
                <div className="text-sm text-white/70">Your transaction was completed successfully.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20">
              <AlertCircle className="w-5 h-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-white">Information</div>
                <div className="text-sm text-white/70">Market data updates every 60 seconds.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20">
              <XCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-white">Error</div>
                <div className="text-sm text-white/70">Unable to connect to the exchange. Please try again.</div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Dropdown Menu */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Dropdown Menu</h2>
          <div className="relative inline-block">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-4 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors"
            >
              Toggle Dropdown
            </button>

            {showDropdown && (
              <div className="absolute left-0 mt-2 w-56 glass-card p-2 z-10">
                <div className="px-3 py-2 border-b border-white/10 mb-2">
                  <div className="text-sm font-medium text-white">John Doe</div>
                  <div className="text-xs text-white/50">john@example.com</div>
                </div>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05] rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#ef4444] hover:bg-white/[0.05] rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Loading States */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">⏳ Loading States</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-3">Spinner</h3>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-white/70">Loading...</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white/70 mb-3">Skeleton Loader</h3>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Icons */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🎯 Icon Library (Lucide React)</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col items-center gap-2">
              <Bell className="w-6 h-6 text-white" />
              <span className="text-xs text-white/50">Bell</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <User className="w-6 h-6 text-white" />
              <span className="text-xs text-white/50">User</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Settings className="w-6 h-6 text-white" />
              <span className="text-xs text-white/50">Settings</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <span className="text-xs text-white/50">Trending Up</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <TrendingDown className="w-6 h-6 text-red-500" />
              <span className="text-xs text-white/50">Trending Down</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-xs text-white/50">Success</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <XCircle className="w-6 h-6 text-red-500" />
              <span className="text-xs text-white/50">Error</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6 text-blue-500" />
              <span className="text-xs text-white/50">Info</span>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="text-center text-white/50 py-8">
          <p>🔮 Coinsphere Design System - Version 1.0</p>
          <p className="text-sm mt-2">Glassmorphism Theme on Pure Black (#000000)</p>
        </div>
      </main>
    </div>
  )
}
