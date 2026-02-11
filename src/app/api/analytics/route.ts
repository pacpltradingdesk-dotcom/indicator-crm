import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStats, getRevenueOverTime, getLeadFunnel } from '@/services/analytics.service'
import { requireAuth } from '@/lib/auth-guard'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const [dashboard, revenue, funnel] = await Promise.all([
    getDashboardStats(),
    getRevenueOverTime(),
    getLeadFunnel(),
  ])

  return NextResponse.json({ ...dashboard, revenueOverTime: revenue, leadFunnel: funnel })
}
