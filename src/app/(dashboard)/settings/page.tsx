'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Save, Plus, Trash2, MessageSquare, CreditCard, Brain, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [products, setProducts] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddTemplate, setShowAddTemplate] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then(setSettings)
    fetch('/api/products').then((r) => r.json()).then(setProducts)
    fetch('/api/templates').then((r) => r.json()).then(setTemplates)
  }, [])

  const saveSettings = async (key: string, value: any) => {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })
    if (res.ok) toast.success('Settings saved')
    else toast.error('Failed to save')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="whatsapp">
        <TabsList>
          <TabsTrigger value="whatsapp"><MessageSquare className="h-4 w-4 mr-1" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="razorpay"><CreditCard className="h-4 w-4 mr-1" /> Razorpay</TabsTrigger>
          <TabsTrigger value="openai"><Brain className="h-4 w-4 mr-1" /> OpenAI</TabsTrigger>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" /> Products</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="embed">Embed Code</TabsTrigger>
        </TabsList>

        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API</CardTitle>
              <CardDescription>Configure Meta WhatsApp Cloud API credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField label="Access Token" setting="whatsapp_access_token" settings={settings} setSettings={setSettings} onSave={saveSettings} type="password" />
              <SettingField label="Phone Number ID" setting="whatsapp_phone_number_id" settings={settings} setSettings={setSettings} onSave={saveSettings} />
              <SettingField label="Business Account ID" setting="whatsapp_business_account_id" settings={settings} setSettings={setSettings} onSave={saveSettings} />
              <SettingField label="Verify Token" setting="whatsapp_verify_token" settings={settings} setSettings={setSettings} onSave={saveSettings} />
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Webhook URL</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/whatsapp</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Razorpay Settings */}
        <TabsContent value="razorpay">
          <Card>
            <CardHeader>
              <CardTitle>Razorpay</CardTitle>
              <CardDescription>Configure Razorpay webhook for automatic payment capture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField label="Key ID" setting="razorpay_key_id" settings={settings} setSettings={setSettings} onSave={saveSettings} />
              <SettingField label="Key Secret" setting="razorpay_key_secret" settings={settings} setSettings={setSettings} onSave={saveSettings} type="password" />
              <SettingField label="Webhook Secret" setting="razorpay_webhook_secret" settings={settings} setSettings={setSettings} onSave={saveSettings} type="password" />
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Webhook URL</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/razorpay</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OpenAI Settings */}
        <TabsContent value="openai">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI</CardTitle>
              <CardDescription>Configure AI-powered lead scoring and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField label="API Key" setting="openai_api_key" settings={settings} setSettings={setSettings} onSave={saveSettings} type="password" />
              <SettingField label="Model" setting="openai_model" settings={settings} setSettings={setSettings} onSave={saveSettings} placeholder="gpt-4o-mini" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Pine Script indicators catalog</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddProduct(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.description || 'No description'}</p>
                      {p.features && (typeof p.features === 'string' ? JSON.parse(p.features) : p.features).length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {(typeof p.features === 'string' ? JSON.parse(p.features) : p.features).map((f: string) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(p.price)}</p>
                      <Badge variant={p.isActive ? 'default' : 'secondary'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p className="text-gray-500 text-center py-4">No products yet</p>}
              </div>
            </CardContent>
          </Card>
          <AddProductDialog open={showAddProduct} onClose={() => setShowAddProduct(false)} onAdded={() => fetch('/api/products').then(r => r.json()).then(setProducts)} />
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>WhatsApp Templates</CardTitle>
                  <CardDescription>Approved message templates for 24h+ conversations</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddTemplate(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{t.name}</p>
                      <div className="flex gap-1">
                        <Badge variant="outline">{t.language}</Badge>
                        <Badge variant="outline">{t.category}</Badge>
                        <Badge variant={t.isApproved ? 'default' : 'secondary'}>{t.isApproved ? 'Approved' : 'Pending'}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{t.content}</p>
                  </div>
                ))}
                {templates.length === 0 && <p className="text-gray-500 text-center py-4">No templates yet</p>}
              </div>
            </CardContent>
          </Card>
          <AddTemplateDialog open={showAddTemplate} onClose={() => setShowAddTemplate(false)} onAdded={() => fetch('/api/templates').then(r => r.json()).then(setTemplates)} />
        </TabsContent>

        {/* Embed Code */}
        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Website Lead Capture</CardTitle>
              <CardDescription>Add this code snippet to your website to capture leads</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">{`<!-- Indicator CRM Lead Capture -->
<script>
function submitLeadForm(e) {
  e.preventDefault();
  var form = e.target;
  var data = {
    phone: form.phone.value,
    name: form.name.value,
    email: form.email.value,
    message: form.message?.value || '',
    interestedProduct: form.product?.value || ''
  };
  fetch('${typeof window !== 'undefined' ? window.location.origin : 'https://your-crm.com'}/api/webhooks/website', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function() {
    alert('Thank you! We will contact you soon.');
    form.reset();
  });
}
</script>

<form onsubmit="submitLeadForm(event)">
  <input name="name" placeholder="Your Name" required />
  <input name="phone" placeholder="Phone Number" required />
  <input name="email" placeholder="Email" type="email" />
  <textarea name="message" placeholder="Your message"></textarea>
  <button type="submit">Get in Touch</button>
</form>`}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SettingField({ label, setting, settings, setSettings, onSave, type = 'text', placeholder = '' }: any) {
  const value = settings[setting] || ''
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2 mt-1">
        <Input
          type={type}
          value={typeof value === 'string' ? value : JSON.stringify(value)}
          onChange={(e) => setSettings({ ...settings, [setting]: e.target.value })}
          placeholder={placeholder || label}
        />
        <Button variant="outline" size="sm" onClick={() => onSave(setting, value)}>
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function AddProductDialog({ open, onClose, onAdded }: any) {
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', features: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        features: form.features ? form.features.split(',').map((f: string) => f.trim()) : [],
      }),
    })
    if (res.ok) {
      toast.success('Product added')
      setForm({ name: '', description: '', price: '', category: '', features: '' })
      onClose()
      onAdded()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nifty Scalper Pro" required />
          </div>
          <div>
            <label className="text-sm font-medium">Price (INR) *</label>
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="4999" required />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description" />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Scalping, Swing, Options" />
          </div>
          <div>
            <label className="text-sm font-medium">Features (comma-separated)</label>
            <Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Real-time alerts, Backtesting, Multi-timeframe" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add Product'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddTemplateDialog({ open, onClose, onAdded }: any) {
  const [form, setForm] = useState({ name: '', content: '', category: 'MARKETING', language: 'en' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Template added')
      setForm({ name: '', content: '', category: 'MARKETING', language: 'en' })
      onClose()
      onAdded()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Template</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Template Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. welcome_message" required />
          </div>
          <div>
            <label className="text-sm font-medium">Content *</label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Template body text" rows={4} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add Template'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
