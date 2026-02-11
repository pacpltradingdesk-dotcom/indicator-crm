'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CreditCard, TrendingUp, IndianRupee, ShoppingBag } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, count: 0, avgValue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then((r) => r.json()),
      fetch('/api/customers?limit=200').then((r) => r.json()),
    ]).then(([analytics, custData]) => {
      // Fetch payments separately
      fetch('/api/payments').then(r => r.ok ? r.json() : []).then(p => {
        setPayments(Array.isArray(p) ? p : [])
      }).catch(() => {})

      setStats({
        total: analytics.stats?.totalRevenue || 0,
        thisMonth: analytics.stats?.revenueThisMonth || 0,
        count: analytics.stats?.converted || 0,
        avgValue: analytics.stats?.totalRevenue && analytics.stats?.converted
          ? analytics.stats.totalRevenue / analytics.stats.converted : 0,
      })
      setLoading(false)
    })
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track revenue and payment history</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-gradient-green rounded-xl p-4 text-white card-hover shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">Total Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
            </div>
          </div>
        </div>
        <div className="stat-gradient-blue rounded-xl p-4 text-white card-hover shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">This Month</p>
              <p className="text-xl font-bold">{formatCurrency(stats.thisMonth)}</p>
            </div>
          </div>
        </div>
        <div className="stat-gradient-purple rounded-xl p-4 text-white card-hover shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">Total Customers</p>
              <p className="text-xl font-bold">{stats.count}</p>
            </div>
          </div>
        </div>
        <div className="stat-gradient-orange rounded-xl p-4 text-white card-hover shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">Avg Order Value</p>
              <p className="text-xl font-bold">{formatCurrency(stats.avgValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <Card className="card-hover rounded-xl overflow-hidden">
        <CardHeader><CardTitle className="text-sm font-medium">Payment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payments yet. Payments will appear here when received via Razorpay webhook.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-accent/50 transition-colors">
                    <TableCell className="font-mono text-xs">{p.razorpayPaymentId || p.id.slice(0, 12)}</TableCell>
                    <TableCell>
                      <Link href={`/customers/${p.customerId}`} className="text-primary hover:underline">
                        {p.customer?.name || p.phone || 'Unknown'}
                      </Link>
                    </TableCell>
                    <TableCell>{p.product?.name || p.description || '-'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{p.method || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'CAPTURED' ? 'default' : p.status === 'FAILED' ? 'destructive' : 'secondary'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.paidAt ? formatDateTime(p.paidAt) : formatDateTime(p.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
