'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPhone, getTemperatureColor, getStageColor, getInitials } from '@/lib/utils'
import { Brain, Flame, Thermometer, Snowflake, Skull, GripVertical, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import toast from 'react-hot-toast'

const STAGES = ['NEW', 'ENGAGED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'CHURNED'] as const

const TEMP_BORDER_COLORS: Record<string, string> = {
  HOT: 'border-l-red-500',
  WARM: 'border-l-orange-500',
  COLD: 'border-l-blue-500',
  DEAD: 'border-l-gray-400',
}

function DraggableLeadCard({ customer }: { customer: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: customer.id,
    data: { customer },
  })

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2.5 bg-card rounded-lg border shadow-sm card-hover border-l-2 ${TEMP_BORDER_COLORS[customer.leadTemperature] || 'border-l-gray-300'} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-1">
        <button {...listeners} {...attributes} className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <Link href={`/customers/${customer.id}`} className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{customer.name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{formatPhone(customer.phone)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-1.5 py-0.5 rounded text-xs ${getTemperatureColor(customer.leadTemperature)}`}>{customer.leadTemperature}</span>
            <div className="flex items-center gap-1 flex-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${customer.leadScore >= 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : customer.leadScore >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                  style={{ width: `${customer.leadScore}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{customer.leadScore}</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function DroppableColumn({ stage, children }: { stage: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage })

  return (
    <div ref={setNodeRef} className="min-w-[200px]">
      <div className={`px-3 py-2 rounded-t-lg text-sm font-medium ${getStageColor(stage)}`}>
        {stage}
      </div>
      <div className={`bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px] transition-colors ${isOver ? 'bg-indigo-500/10 ring-2 ring-indigo-500/30' : ''}`}>
        {children}
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [funnel, setFunnel] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'scoring'>('scoring')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    Promise.all([
      fetch('/api/customers?limit=200&sortBy=leadScore&sortOrder=desc').then((r) => r.json()),
      fetch('/api/analytics').then((r) => r.json()),
    ]).then(([custData, analytics]) => {
      setCustomers(custData.customers || [])
      setFunnel(analytics.leadFunnel || [])
      setLoading(false)
    })
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const customerId = active.id as string
    const newStage = over.id as string
    const customer = customers.find((c) => c.id === customerId)

    if (!customer || customer.leadStage === newStage) return

    // Optimistic update
    setCustomers((prev) =>
      prev.map((c) => c.id === customerId ? { ...c, leadStage: newStage } : c)
    )

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadStage: newStage }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Moved ${customer.name || 'lead'} to ${newStage}`)
    } catch {
      // Revert on failure
      setCustomers((prev) =>
        prev.map((c) => c.id === customerId ? { ...c, leadStage: customer.leadStage } : c)
      )
      toast.error('Failed to update lead stage')
    }
  }, [customers])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse-soft shadow-glow">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
      </div>
    )
  }

  const tempCounts = {
    HOT: customers.filter((c) => c.leadTemperature === 'HOT').length,
    WARM: customers.filter((c) => c.leadTemperature === 'WARM').length,
    COLD: customers.filter((c) => c.leadTemperature === 'COLD').length,
    DEAD: customers.filter((c) => c.leadTemperature === 'DEAD').length,
  }

  const activeCustomer = activeId ? customers.find((c) => c.id === activeId) : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and manage your sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'scoring' ? 'default' : 'outline'} size="sm" onClick={() => setView('scoring')}>Scoring</Button>
          <Button variant={view === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setView('kanban')}>Kanban</Button>
        </div>
      </div>

      {/* Temperature Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-gradient-red rounded-xl p-4 text-white card-hover shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">Hot</p>
              <p className="text-2xl font-bold">{tempCounts.HOT}</p>
            </div>
          </div>
        </div>
        <div className="stat-gradient-orange rounded-xl p-4 text-white card-hover shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Thermometer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">Warm</p>
              <p className="text-2xl font-bold">{tempCounts.WARM}</p>
            </div>
          </div>
        </div>
        <div className="stat-gradient-blue rounded-xl p-4 text-white card-hover shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Snowflake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">Cold</p>
              <p className="text-2xl font-bold">{tempCounts.COLD}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 rounded-xl p-4 text-white card-hover shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Skull className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">Dead</p>
              <p className="text-2xl font-bold">{tempCounts.DEAD}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Chart */}
      <Card className="card-hover">
        <CardHeader><CardTitle className="text-sm font-medium">Lead Funnel</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="url(#funnelGradient)" radius={[0, 4, 4, 0]} />
              <defs>
                <linearGradient id="funnelGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {view === 'scoring' ? (
        /* Scoring View */
        <Card className="card-hover">
          <CardHeader><CardTitle className="text-sm font-medium">Lead Scores (Highest First)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customers.slice(0, 50).map((c) => (
                <Link key={c.id} href={`/customers/${c.id}`} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 border border-l-2 transition-colors ${TEMP_BORDER_COLORS[c.leadTemperature] || 'border-l-gray-300'}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{formatPhone(c.phone)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(c.leadStage)}`}>{c.leadStage}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTemperatureColor(c.leadTemperature)}`}>{c.leadTemperature}</span>
                  <div className="w-24 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${c.leadScore >= 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : c.leadScore >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                        style={{ width: `${c.leadScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{c.leadScore}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Kanban View with Drag and Drop */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
            {STAGES.map((stage) => {
              const stageCustomers = customers.filter((c) => c.leadStage === stage)
              return (
                <DroppableColumn key={stage} stage={stage}>
                  <div className="text-xs text-muted-foreground text-center mb-1">{stageCustomers.length} leads</div>
                  {stageCustomers.slice(0, 20).map((c) => (
                    <DraggableLeadCard key={c.id} customer={c} />
                  ))}
                </DroppableColumn>
              )
            })}
          </div>

          <DragOverlay>
            {activeCustomer ? (
              <div className="p-2.5 bg-card rounded-lg border shadow-xl w-[180px] scale-105 rotate-2">
                <p className="font-medium text-sm truncate">{activeCustomer.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{formatPhone(activeCustomer.phone)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${getTemperatureColor(activeCustomer.leadTemperature)}`}>
                    {activeCustomer.leadTemperature}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
