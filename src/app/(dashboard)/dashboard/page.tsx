'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Flame, TrendingUp, CreditCard, MessageSquare, UserPlus, Activity } from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6']

const ACTIVITY_ICONS: Record<string, string> = {
  LEAD_CREATED: 'bg-blue-500',
  PAYMENT_RECEIVED: 'bg-green-500',
  MESSAGE_SENT: 'bg-indigo-500',
  MESSAGE_RECEIVED: 'bg-purple-500',
  STAGE_CHANGED: 'bg-orange-500',
  TEMPERATURE_CHANGED: 'bg-red-500',
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  // SSE for real-time activity
  useEffect(() => {
    const es = new EventSource('/api/sse?channel=dashboard')
    es.addEventListener('activity', (e) => {
      const activity = JSON.parse(e.data)
      setData((prev: any) => prev ? {
        ...prev,
        recentActivities: [activity, ...(prev.recentActivities || [])].slice(0, 20),
      } : prev)
    })
    return () => es.close()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse-soft shadow-glow">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
      </div>
    )
  }

  const stats = data?.stats || {}
  const firstName = session?.user?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}, {firstName}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Here&apos;s what&apos;s happening with your leads today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Leads" value={stats.totalCustomers} gradient="stat-gradient-blue" />
        <StatCard icon={Flame} label="Hot Leads" value={stats.hotLeads} gradient="stat-gradient-red" />
        <StatCard icon={TrendingUp} label="Converted" value={stats.converted} gradient="stat-gradient-green" />
        <StatCard icon={CreditCard} label="Revenue" value={formatCurrency(stats.totalRevenue)} gradient="stat-gradient-purple" />
        <StatCard icon={MessageSquare} label="Active Chats" value={stats.activeConversations} gradient="stat-gradient-orange" />
        <StatCard icon={UserPlus} label="New This Week" value={stats.newLeadsThisWeek} gradient="stat-gradient-indigo" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Funnel */}
        <Card className="card-hover">
          <CardHeader><CardTitle className="text-sm font-medium">Lead Funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.leadFunnel || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card className="card-hover">
          <CardHeader><CardTitle className="text-sm font-medium">Lead Sources</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.sourceDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {(data?.sourceDistribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card className="card-hover">
          <CardHeader><CardTitle className="text-sm font-medium">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.revenueOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="amount" stroke="url(#lineGradient)" strokeWidth={2} dot={false} />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stage Distribution */}
        <Card className="card-hover">
          <CardHeader><CardTitle className="text-sm font-medium">Stage Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.stageDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {(data?.stageDistribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.recentActivities || []).map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ACTIVITY_ICONS[activity.type] || 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">{activity.description}</p>
                  <p className="text-muted-foreground text-xs">{timeAgo(activity.createdAt)}</p>
                </div>
              </div>
            ))}
            {(!data?.recentActivities || data.recentActivities.length === 0) && (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: any; gradient: string }) {
  return (
    <div className={`${gradient} rounded-xl p-4 text-white card-hover shadow-md`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-white/80">{label}</p>
          <p className="text-xl font-bold">{value ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
