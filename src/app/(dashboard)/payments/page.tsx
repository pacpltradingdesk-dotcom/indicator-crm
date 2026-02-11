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
      // Collect all payments from customers
      const allPayments: any[] = []
      const customers = custData.customers || []

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <IndianRupee className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">This Month</p>
              <p className="text-xl font-bold">{formatCurrency(stats.thisMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Total Customers</p>
              <p className="text-xl font-bold">{stats.count}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-xs text-gray-500">Avg Order Value</p>
              <p className="text-xl font-bold">{formatCurrency(stats.avgValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
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
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No payments yet. Payments will appear here when received via Razorpay webhook.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p: any) => (
                  <TableRow key={p.id}>
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
                    <TableCell className="text-sm text-gray-500">{p.paidAt ? formatDateTime(p.paidAt) : formatDateTime(p.createdAt)}</TableCell>
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
