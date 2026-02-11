import { NextRequest, NextResponse } from 'next/server'
import { analyzeCustomer } from '@/services/ai-scoring.service'
import { requireAuth } from '@/lib/auth-guard'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'ai')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const { customerId } = await req.json()

  if (!customerId) {
    return NextResponse.json({ error: 'customerId required' }, { status: 400 })
  }

  const result = await analyzeCustomer(customerId)

  if (!result) {
    return NextResponse.json({ error: 'Analysis failed or no messages found' }, { status: 400 })
  }

  return NextResponse.json(result)
}
