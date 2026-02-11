'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TrendingUp } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-pulse-soft">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-glow">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/30 dot-pattern">
        <div className="p-4 pt-14 lg:p-6 lg:pt-6">{children}</div>
      </main>
    </div>
  )
}
