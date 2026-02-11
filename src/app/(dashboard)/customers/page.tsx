'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Download, Phone, Mail, Calendar, Trash2, Tag, ArrowRight } from 'lucide-react'
import { formatPhone, formatDate, getTemperatureColor, getStageColor, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [tempFilter, setTempFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [bulkValue, setBulkValue] = useState('')

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (stageFilter) params.set('stage', stageFilter)
    if (tempFilter) params.set('temperature', tempFilter)
    if (sourceFilter) params.set('source', sourceFilter)

    const res = await fetch(`/api/customers?${params}`)
    const data = await res.json()
    setCustomers(data.customers || [])
    setTotalPages(data.pagination?.totalPages || 1)
    setLoading(false)
  }, [page, search, stageFilter, tempFilter, sourceFilter])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)))
    }
  }

  const executeBulkAction = async () => {
    if (selectedIds.size === 0 || !bulkAction) return

    if (bulkAction === 'DELETE' && !confirm(`Delete ${selectedIds.size} customers? This cannot be undone.`)) return

    const needsValue = ['CHANGE_STAGE', 'CHANGE_TEMPERATURE', 'ADD_TAG', 'REMOVE_TAG'].includes(bulkAction)
    if (needsValue && !bulkValue) {
      toast.error('Please select a value')
      return
    }

    try {
      const res = await fetch('/api/customers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerIds: Array.from(selectedIds),
          action: bulkAction,
          value: bulkValue || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Updated ${data.affected} customers`)
        setSelectedIds(new Set())
        setBulkAction('')
        setBulkValue('')
        fetchCustomers()
      } else {
        toast.error(data.error || 'Bulk action failed')
      }
    } catch {
      toast.error('Bulk action failed')
    }
  }

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Source', 'Stage', 'Temperature', 'Score', 'Total Spent', 'Created']
    const rows = customers.map((c) => [
      c.name || '', c.phone, c.email || '', c.source, c.leadStage, c.leadTemperature,
      c.leadScore, c.totalSpent, c.createdAt
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customers.csv'
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Select value={bulkAction} onValueChange={(v) => { setBulkAction(v); setBulkValue('') }}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Bulk action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CHANGE_STAGE">Change Stage</SelectItem>
              <SelectItem value="CHANGE_TEMPERATURE">Change Temperature</SelectItem>
              <SelectItem value="ADD_TAG">Add Tag</SelectItem>
              <SelectItem value="REMOVE_TAG">Remove Tag</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
            </SelectContent>
          </Select>

          {bulkAction === 'CHANGE_STAGE' && (
            <Select value={bulkValue} onValueChange={setBulkValue}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {['NEW', 'ENGAGED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'CHURNED'].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {bulkAction === 'CHANGE_TEMPERATURE' && (
            <Select value={bulkValue} onValueChange={setBulkValue}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue placeholder="Select temp" /></SelectTrigger>
              <SelectContent>
                {['HOT', 'WARM', 'COLD', 'DEAD'].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(bulkAction === 'ADD_TAG' || bulkAction === 'REMOVE_TAG') && (
            <Input
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder="Tag name..."
              className="w-[150px] h-8"
            />
          )}

          <Button size="sm" onClick={executeBulkAction} disabled={!bulkAction}>
            Apply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedIds(new Set()); setBulkAction(''); setBulkValue('') }}>
            Cancel
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {['NEW', 'ENGAGED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'CHURNED'].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tempFilter} onValueChange={(v) => { setTempFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Temperature" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Temps</SelectItem>
            {['HOT', 'WARM', 'COLD', 'DEAD'].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {['WHATSAPP', 'RAZORPAY', 'MANUAL', 'WEBSITE'].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.size === customers.length}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead className="hidden lg:table-cell">Score</TableHead>
                <TableHead className="hidden lg:table-cell">Messages</TableHead>
                <TableHead className="hidden xl:table-cell">Spent</TableHead>
                <TableHead className="hidden xl:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className={`cursor-pointer hover:bg-accent/50 ${selectedIds.has(c.id) ? 'bg-primary/5' : ''}`}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/customers/${c.id}`} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <p className="font-medium">{c.name || 'Unknown'}</p>
                          {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm hidden sm:table-cell">{formatPhone(c.phone)}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline">{c.source}</Badge></TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(c.leadStage)}`}>{c.leadStage}</span></TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTemperatureColor(c.leadTemperature)}`}>{c.leadTemperature}</span></TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${c.leadScore}%` }} />
                        </div>
                        <span className="text-xs">{c.leadScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{c.totalMessages}</TableCell>
                    <TableCell className="hidden xl:table-cell">{c.totalSpent > 0 ? `₹${c.totalSpent.toLocaleString()}` : '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Add Customer Dialog */}
      <AddCustomerDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} onAdded={fetchCustomers} />
    </div>
  )
}

function AddCustomerDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ phone: '', name: '', email: '', source: 'MANUAL', notes: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Customer added')
      setForm({ phone: '', name: '', email: '', source: 'MANUAL', notes: '' })
      onClose()
      onAdded()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to add')
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Phone *</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" required />
          </div>
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add Customer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
