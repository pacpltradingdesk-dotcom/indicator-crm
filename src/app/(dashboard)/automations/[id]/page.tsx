'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Zap, CheckCircle2, XCircle, Clock, Play, TrendingUp } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AutomationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [automation, setAutomation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/automations/${id}`)
      .then((r) => r.json())
      .then(setAutomation)
      .finally(() => setLoading(false))
  }, [id])

  const toggleActive = async () => {
    const res = await fetch(`/api/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !automation.isActive }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAutomation({ ...automation, ...updated })
      toast.success(updated.isActive ? 'Activated' : 'Deactivated')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse-soft shadow-glow">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
      </div>
    )
  }
  if (!automation) return <div className="text-center py-8 text-muted-foreground">Automation not found</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/automations')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className={`h-5 w-5 ${automation.isActive ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            {automation.name}
          </h1>
          {automation.description && <p className="text-muted-foreground text-sm">{automation.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{automation.isActive ? 'Active' : 'Inactive'}</span>
          <Switch checked={automation.isActive} onCheckedChange={toggleActive} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-gradient-indigo rounded-xl p-4 text-white card-hover">
          <p className="text-xs text-white/80">Trigger</p>
          <Badge className="mt-1 bg-white/20 text-white border-0">{automation.trigger}</Badge>
        </div>
        <div className="stat-gradient-purple rounded-xl p-4 text-white card-hover">
          <p className="text-xs text-white/80">Steps</p>
          <p className="text-2xl font-bold">{automation.steps?.length || 0}</p>
        </div>
        <div className="stat-gradient-blue rounded-xl p-4 text-white card-hover">
          <p className="text-xs text-white/80">Total Runs</p>
          <p className="text-2xl font-bold">{automation.runs?.length || 0}</p>
        </div>
      </div>

      {/* Workflow Steps */}
      <Card className="card-hover">
        <CardHeader><CardTitle className="text-sm font-medium">Workflow Steps</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {automation.steps?.map((step: any, i: number) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {i + 1}
                  </div>
                  {i < automation.steps.length - 1 && <div className="w-0.5 h-8 bg-border mt-1" />}
                </div>
                <div className="flex-1 border border-border/50 rounded-lg p-3">
                  <p className="font-medium text-sm">{step.type.replace(/_/g, ' ')}</p>
                  <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{JSON.stringify(step.config, null, 2)}</pre>
                </div>
              </div>
            ))}
            {(!automation.steps || automation.steps.length === 0) && (
              <p className="text-muted-foreground text-sm">No steps configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Run History */}
      <Card className="card-hover">
        <CardHeader><CardTitle className="text-sm font-medium">Run History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {automation.runs?.map((run: any) => (
              <div key={run.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors">
                {run.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : run.status === 'FAILED' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : run.status === 'RUNNING' ? (
                  <Play className="h-5 w-5 text-blue-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{run.customer?.name || run.customer?.phone || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(run.startedAt)}</p>
                </div>
                <Badge variant={
                  run.status === 'COMPLETED' ? 'default' :
                  run.status === 'FAILED' ? 'destructive' : 'secondary'
                }>{run.status}</Badge>
                {run.error && <p className="text-xs text-red-500">{run.error}</p>}
              </div>
            ))}
            {(!automation.runs || automation.runs.length === 0) && (
              <p className="text-muted-foreground text-sm text-center py-4">No runs yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
