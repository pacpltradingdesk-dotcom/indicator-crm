import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { validateBody, createProductSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const products = await prisma.product.findMany({
    include: { _count: { select: { payments: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()
  const validation = validateBody(createProductSchema, body)
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
  const { name, description, price, currency, category, features } = validation.data

  const product = await prisma.product.create({
    data: {
      name,
      description: description || null,
      price,
      currency: currency || 'INR',
      category: category || null,
      features: JSON.stringify(features || []),
    },
  })
  return NextResponse.json(product, { status: 201 })
}
