import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { validateBody, updateSettingSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const settings = await prisma.systemSetting.findMany()
  const result: Record<string, any> = {}
  settings.forEach((s) => {
    try { result[s.key] = JSON.parse(s.value) } catch { result[s.key] = s.value }
  })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()

  // Validate each key-value pair
  for (const [key, value] of Object.entries(body)) {
    const validation = validateBody(updateSettingSchema, { key, value: String(value) })
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  for (const [key, value] of Object.entries(body)) {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value)
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: strValue },
      update: { value: strValue },
    })
  }

  return NextResponse.json({ success: true })
}
