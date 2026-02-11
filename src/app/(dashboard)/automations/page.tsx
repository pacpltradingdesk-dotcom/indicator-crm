'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Zap, Play, Pause, Settings, Trash2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const TRIGGERS = [
  { value: 'CUSTOMER_CREATED', label: 'Customer Created' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
  { value: 'MESSAGE_RECEIVED', label: 'Message Received' },
  { value: 'STAGE_CHANGED', label: 'Stage Changed' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'TAG_ADDED', label: 'Tag Added' },
  { value: 'MANUAL', label: 'Manual Trigger' },
]

const STEP_TYPES = [
  { value: 'SEND_TEXT', label: 'Send WhatsApp Text' },
  { value: 'SEND_TEMPLATE', label: 'Send Template' },
  { value: 'WAIT', label: 'Wait / Delay' },
  { value: 'WAIT_FOR_REPLY', label: 'Wait for Reply' },
  { value: 'ADD_TAG', label: 'Add Tag' },
  { value: 'CHANGE_STAGE', label: 'Change Stage' },
  { value: 'AI_ANALYZE', label: 'AI Analyze' },
  { value: 'NOTIFY_ADMIN', label: 'Notify Admin' },
  { value: 'SCHEDULE_CALL', label: 'Schedule Call' },
  { value: 'CONDITIONAL_BRANCH', label: 'Conditional Branch' },
]

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchAutomations = () => {
    fetch('/api/automations')
      .then((r) => r.json())
      .then(setAutomations)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAutomations() }, [])

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    fetchAutomations()
  }

  const deleteAutomation = async (id: string) => {
    if (!confirm('Delete this automation?')) return
    await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    toast.success('Automation deleted')
    fetchAutomations()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Automations</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Automation
        </Button>
      </div>

      {/* Automation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((auto) => (
          <Card key={auto.id} className={`${!auto.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${auto.isActive ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <CardTitle className="text-sm">{auto.name}</CardTitle>
                </div>
                <Switch checked={auto.isActive} onCheckedChange={() => toggleActive(auto.id, auto.isActive)} />
              </div>
            </CardHeader>
            <CardContent>
              {auto.description && (
                <p className="text-xs text-gray-500 mb-3">{auto.description}</p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{auto.trigger}</Badge>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{auto.steps?.length || 0} steps</span>
              </div>

              {/* Step preview */}
              <div className="space-y-1 mb-3">
                {auto.steps?.slice(0, 3).map((step: any, i: number) => (
                  <div key={step.id} className="flex items-center gap-2 text-xs">
                    <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px]">{i + 1}</span>
                    <span className="text-gray-600">{STEP_TYPES.find((s) => s.value === step.type)?.label || step.type}</span>
                  </div>
                ))}
                {(auto.steps?.length || 0) > 3 && (
                  <p className="text-xs text-gray-400 pl-6">+{auto.steps.length - 3} more steps</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-gray-400">{auto._count?.runs || 0} runs</span>
                <div className="flex gap-1">
                  <Link href={`/automations/${auto.id}`}>
                    <Button variant="ghost" size="sm"><Settings className="h-3 w-3" /></Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => deleteAutomation(auto.id)}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {automations.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Zap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No automations yet</p>
              <Button className="mt-3" onClick={() => setShowCreate(true)}>Create Your First Automation</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <CreateAutomationDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchAutomations} />
    </div>
  )
}

function CreateAutomationDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [trigger, setTrigger] = useState('')
  const [steps, setSteps] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const addStep = () => {
    setSteps([...steps, { type: 'SEND_TEXT', config: {} }])
  }

  const updateStep = (index: number, field: string, value: any) => {
    const updated = [...steps]
    if (field === 'type') {
      updated[index] = { type: value, config: {} }
    } else {
      updated[index] = { ...updated[index], config: { ...updated[index].config, [field]: value } }
    }
    setSteps(updated)
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !trigger) return

    setSaving(true)
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, trigger, steps }),
    })

    if (res.ok) {
      toast.success('Automation created')
      setName('')
      setDescription('')
      setTrigger('')
      setSteps([])
      onClose()
      onCreated()
    } else {
      toast.error('Failed to create')
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Automation</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Lead Welcome Flow" required />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this automation do?" rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Trigger *</label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
              <SelectContent>
                {TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Steps Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Steps</label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-3 w-3 mr-1" /> Add Step
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Step {i + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(i)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                  <Select value={step.type} onValueChange={(v) => updateStep(i, 'type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STEP_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {/* Config fields based on type */}
                  {step.type === 'SEND_TEXT' && (
                    <Textarea
                      value={step.config.text || ''}
                      onChange={(e) => updateStep(i, 'text', e.target.value)}
                      placeholder="Message text (use {{name}} for customer name)"
                      rows={2}
                    />
                  )}
                  {step.type === 'SEND_TEMPLATE' && (
                    <Input
                      value={step.config.templateName || ''}
                      onChange={(e) => updateStep(i, 'templateName', e.target.value)}
                      placeholder="Template name"
                    />
                  )}
                  {step.type === 'WAIT' && (
                    <div className="flex gap-2">
                      <Input type="number" value={step.config.hours || ''} onChange={(e) => updateStep(i, 'hours', parseInt(e.target.value) || 0)} placeholder="Hours" />
                      <Input type="number" value={step.config.minutes || ''} onChange={(e) => updateStep(i, 'minutes', parseInt(e.target.value) || 0)} placeholder="Minutes" />
                    </div>
                  )}
                  {step.type === 'ADD_TAG' && (
                    <Input value={step.config.tagName || ''} onChange={(e) => updateStep(i, 'tagName', e.target.value)} placeholder="Tag name" />
                  )}
                  {step.type === 'CHANGE_STAGE' && (
                    <Select value={step.config.stage || ''} onValueChange={(v) => updateStep(i, 'stage', v)}>
                      <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent>
                        {['NEW', 'ENGAGED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'CHURNED'].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {step.type === 'NOTIFY_ADMIN' && (
                    <Input value={step.config.message || ''} onChange={(e) => updateStep(i, 'message', e.target.value)} placeholder="Notification message" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Automation'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
