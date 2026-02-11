import { TrendingUp } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center animate-pulse-soft">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-glow">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
