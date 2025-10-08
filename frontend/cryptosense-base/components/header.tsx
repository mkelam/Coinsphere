import { Bell, User } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0E27]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🔮</div>
            <span className="text-xl font-semibold">CoinSphere</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
