import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppClient } from '@/lib/whatsapp'
import { sseManager } from '@/lib/sse'
import { requireAuth } from '@/lib/auth-guard'
import { validateBody, sendMessageSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

// GET /api/messages?customerId=xxx
export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!customerId) {
    return NextResponse.json({ error: 'customerId required' }, { status: 400 })
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { customerId } }),
  ])

  return NextResponse.json({ messages, total })
}

// POST /api/messages - Send a message
export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'message')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()
  const validation = validateBody(sendMessageSchema, body)
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
  const { customerId, content, type, templateName, templateParams } = validation.data

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const wa = new WhatsAppClient()
  let whatsappMsgId: string | undefined

  try {
    if (type === 'TEMPLATE' && templateName) {
      const result = await wa.sendTemplate(customer.phone, templateName, 'en', templateParams)
      whatsappMsgId = result.messages?.[0]?.id
    } else {
      const result = await wa.sendText(customer.phone, content)
      whatsappMsgId = result.messages?.[0]?.id
    }
  } catch (error: any) {
    // Store as failed message
    const message = await prisma.message.create({
      data: {
        customerId,
        direction: 'OUTBOUND',
        type: type === 'TEMPLATE' ? 'TEMPLATE' : 'TEXT',
        content,
        templateName,
        status: 'FAILED',
        metadata: JSON.stringify({ error: error.message }),
      },
    })
    return NextResponse.json({ message, error: error.message }, { status: 500 })
  }

  const message = await prisma.message.create({
    data: {
      customerId,
      direction: 'OUTBOUND',
      type: type === 'TEMPLATE' ? 'TEMPLATE' : 'TEXT',
      content,
      templateName,
      whatsappMsgId,
      status: 'SENT',
    },
  })

  // Update customer stats
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalMessages: { increment: 1 },
      lastMessageAt: new Date(),
    },
  })

  // SSE broadcast
  sseManager.broadcast('chat', 'new-message', {
    ...message,
    customer: { id: customer.id, name: customer.name, phone: customer.phone },
  })

  return NextResponse.json(message, { status: 201 })
}
