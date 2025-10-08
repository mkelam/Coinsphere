import { Plus } from "lucide-react"

export function QuickActions() {
  return (
    <div className="flex gap-3 mb-6">
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-sm font-medium transition-colors backdrop-blur-xl">
        <Plus className="w-4 h-4" />
        Add Exchange
      </button>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-sm font-medium transition-colors backdrop-blur-xl">
        <Plus className="w-4 h-4" />
        Add Wallet
      </button>
    </div>
  )
}
