'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Phone, Mail, Calendar, MessageSquare, CreditCard, Brain, Save, Trash2 } from 'lucide-react'
import { formatPhone, formatCurrency, formatDateTime, getTemperatureColor, getStageColor, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data)
        setForm({
          name: data.name || '',
          email: data.email || '',
          leadStage: data.leadStage,
          leadTemperature: data.leadTemperature,
          notes: data.notes || '',
          tradingExperience: data.tradingExperience || '',
        })
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const updated = await res.json()
      setCustomer({ ...customer, ...updated })
      setEditing(false)
      toast.success('Customer updated')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this customer? This cannot be undone.')) return
    await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    toast.success('Customer deleted')
    router.push('/customers')
  }

  const handleAiAnalyze = async () => {
    setAnalyzing(true)
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: id }),
    })
    if (res.ok) {
      const result = await res.json()
      setCustomer((prev: any) => ({
        ...prev,
        leadScore: result.leadScore,
        leadTemperature: result.temperature,
        aiSummary: result.summary,
        tradingExperience: result.tradingExperience,
      }))
      toast.success(`AI Score: ${result.leadScore}/100`)
    } else {
      toast.error('Analysis failed')
    }
    setAnalyzing(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!customer) return <div className="text-center py-8 text-gray-500">Customer not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/customers')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{customer.name || 'Unknown'}</h1>
          <p className="text-gray-500 font-mono">{formatPhone(customer.phone)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAiAnalyze} disabled={analyzing}>
            <Brain className="h-4 w-4 mr-1" /> {analyzing ? 'Analyzing...' : 'AI Analyze'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/chat?customer=${id}`)}>
            <MessageSquare className="h-4 w-4 mr-1" /> Chat
          </Button>
          {editing ? (
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Save</Button>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500">Score</p>
          <p className="text-2xl font-bold">{customer.leadScore}<span className="text-sm text-gray-400">/100</span></p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500">Stage</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(customer.leadStage)}`}>{customer.leadStage}</span>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500">Temperature</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTemperatureColor(customer.leadTemperature)}`}>{customer.leadTemperature}</span>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500">Messages</p>
          <p className="text-2xl font-bold">{customer.totalMessages}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500">Spent</p>
          <p className="text-2xl font-bold">{formatCurrency(customer.totalSpent)}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  {editing ? (
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  ) : (
                    <p>{customer.name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  {editing ? (
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  ) : (
                    <p>{customer.email || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Stage</label>
                  {editing ? (
                    <Select value={form.leadStage} onValueChange={(v) => setForm({ ...form, leadStage: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['NEW', 'ENGAGED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'CHURNED'].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p>{customer.leadStage}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Temperature</label>
                  {editing ? (
                    <Select value={form.leadTemperature} onValueChange={(v) => setForm({ ...form, leadTemperature: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['HOT', 'WARM', 'COLD', 'DEAD'].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p>{customer.leadTemperature}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Source</label>
                  <p><Badge variant="outline">{customer.source}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="font-mono">{formatPhone(customer.phone)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                {editing ? (
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                ) : (
                  <p className="text-gray-600">{customer.notes || 'No notes'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {customer.tags?.map((ct: any) => (
                    <Badge key={ct.id} variant="secondary" style={{ backgroundColor: ct.tag.color + '20', color: ct.tag.color }}>
                      {ct.tag.name} {ct.aiConfidence && <span className="ml-1 opacity-50">{Math.round(ct.aiConfidence * 100)}%</span>}
                    </Badge>
                  ))}
                  {(!customer.tags || customer.tags.length === 0) && <span className="text-gray-400 text-sm">No tags</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {customer.activities?.map((a: any) => (
                  <div key={a.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p>{a.description}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {(!customer.activities || customer.activities.length === 0) && (
                  <p className="text-gray-500">No activity yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {customer.messages?.map((m: any) => (
                  <div key={m.id} className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      m.direction === 'OUTBOUND' ? 'bg-primary text-primary-foreground' : 'bg-gray-100'
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${m.direction === 'OUTBOUND' ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                        {formatDateTime(m.createdAt)} {m.status && `· ${m.status}`}
                      </p>
                    </div>
                  </div>
                ))}
                {(!customer.messages || customer.messages.length === 0) && (
                  <p className="text-gray-500 text-center">No messages yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {customer.payments?.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{p.product?.name || p.description || 'Payment'}</p>
                      <p className="text-sm text-gray-500">{p.razorpayPaymentId} · {p.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(p.amount)}</p>
                      <Badge variant={p.status === 'CAPTURED' ? 'default' : 'secondary'}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
                {(!customer.payments || customer.payments.length === 0) && (
                  <p className="text-gray-500 text-center">No payments yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardContent className="p-6 space-y-4">
              {customer.aiSummary ? (
                <>
                  <div>
                    <label className="text-sm font-medium">AI Summary</label>
                    <p className="mt-1 text-gray-700">{customer.aiSummary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Trading Experience</label>
                      <p className="capitalize">{customer.tradingExperience || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Interested Products</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(typeof customer.interestedProducts === 'string' ? JSON.parse(customer.interestedProducts || '[]') : customer.interestedProducts || []).map((p: string) => (
                          <Badge key={p} variant="outline">{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Preferred Markets</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(typeof customer.preferredMarkets === 'string' ? JSON.parse(customer.preferredMarkets || '[]') : customer.preferredMarkets || []).map((m: string) => (
                          <Badge key={m} variant="outline">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No AI analysis yet</p>
                  <Button className="mt-3" onClick={handleAiAnalyze} disabled={analyzing}>
                    {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
