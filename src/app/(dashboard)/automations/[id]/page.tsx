'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Zap, CheckCircle2, XCircle, Clock, Play } from 'lucide-react'
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!automation) return <div className="text-center py-8 text-gray-500">Automation not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/automations')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className={`h-5 w-5 ${automation.isActive ? 'text-yellow-500' : 'text-gray-400'}`} />
            {automation.name}
          </h1>
          {automation.description && <p className="text-gray-500 text-sm">{automation.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{automation.isActive ? 'Active' : 'Inactive'}</span>
          <Switch checked={automation.isActive} onCheckedChange={toggleActive} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Trigger</p>
            <Badge className="mt-1">{automation.trigger}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Steps</p>
            <p className="text-2xl font-bold">{automation.steps?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Runs</p>
            <p className="text-2xl font-bold">{automation.runs?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Steps */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Workflow Steps</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {automation.steps?.map((step: any, i: number) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {i + 1}
                  </div>
                  {i < automation.steps.length - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 border rounded-lg p-3">
                  <p className="font-medium text-sm">{step.type.replace(/_/g, ' ')}</p>
                  <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{JSON.stringify(step.config, null, 2)}</pre>
                </div>
              </div>
            ))}
            {(!automation.steps || automation.steps.length === 0) && (
              <p className="text-gray-500 text-sm">No steps configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Run History */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Run History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {automation.runs?.map((run: any) => (
              <div key={run.id} className="flex items-center gap-3 p-3 border rounded-lg">
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
                  <p className="text-xs text-gray-500">{formatDateTime(run.startedAt)}</p>
                </div>
                <Badge variant={
                  run.status === 'COMPLETED' ? 'default' :
                  run.status === 'FAILED' ? 'destructive' : 'secondary'
                }>{run.status}</Badge>
                {run.error && <p className="text-xs text-red-500">{run.error}</p>}
              </div>
            ))}
            {(!automation.runs || automation.runs.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No runs yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
