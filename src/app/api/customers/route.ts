import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/utils'
import { requireAuth } from '@/lib/auth-guard'
import { validateBody, createCustomerSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

// GET /api/customers - List customers with filters
export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const stage = searchParams.get('stage') || ''
  const temperature = searchParams.get('temperature') || ''
  const source = searchParams.get('source') || ''
  const tag = searchParams.get('tag') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const fields = searchParams.get('fields')

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (stage) where.leadStage = stage
  if (temperature) where.leadTemperature = temperature
  if (source) where.source = source
  if (tag) {
    where.tags = { some: { tag: { name: tag } } }
  }

  // Minimal mode for chat conversation list - skip heavy includes
  const isMinimal = fields === 'minimal'

  const [customers, total] = await Promise.all([
    isMinimal
      ? prisma.customer.findMany({
          where,
          select: {
            id: true, name: true, phone: true, leadTemperature: true,
            totalMessages: true, lastMessageAt: true, leadStage: true,
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        })
      : prisma.customer.findMany({
          where,
          include: {
            tags: { include: { tag: true } },
            _count: { select: { messages: true, payments: true } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
    prisma.customer.count({ where }),
  ])

  return NextResponse.json({
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST /api/customers - Create customer
export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()
  const validation = validateBody(createCustomerSchema, body)
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
  const { phone, name, email, source, leadStage, leadTemperature, notes, tags } = validation.data

  const normalizedPhone = normalizePhone(phone)

  // Check if customer exists
  const existing = await prisma.customer.findUnique({
    where: { phone: normalizedPhone },
  })

  if (existing) {
    return NextResponse.json({ error: 'Customer with this phone already exists' }, { status: 409 })
  }

  const customer = await prisma.customer.create({
    data: {
      phone: normalizedPhone,
      name: name || null,
      email: email || null,
      source: source || 'MANUAL',
      leadStage: leadStage || 'NEW',
      leadTemperature: leadTemperature || 'COLD',
      notes: notes || null,
    },
    include: {
      tags: { include: { tag: true } },
    },
  })

  // Add tags if provided
  if (tags?.length) {
    for (const tagName of tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {},
      })
      await prisma.customerTag.create({
        data: { customerId: customer.id, tagId: tag.id },
      })
    }
  }

  // Log activity
  await prisma.activity.create({
    data: {
      type: 'CUSTOMER_CREATED',
      description: `New customer added: ${name || normalizedPhone}`,
      customerId: customer.id,
    },
  })

  const result = await prisma.customer.findUnique({
    where: { id: customer.id },
    include: {
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json(result, { status: 201 })
}
