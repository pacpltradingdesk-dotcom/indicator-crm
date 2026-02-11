import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { validateBody, updateCustomerSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

// GET /api/customers/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        include: { product: true },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      workflowRuns: {
        include: { automation: true },
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  return NextResponse.json(customer)
}

// PATCH /api/customers/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()
  const validation = validateBody(updateCustomerSchema, body)
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })

  const { name, email, leadStage, leadTemperature, notes, source, tags } = validation.data

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (email !== undefined) updateData.email = email
  if (leadStage !== undefined) updateData.leadStage = leadStage
  if (leadTemperature !== undefined) updateData.leadTemperature = leadTemperature
  if (notes !== undefined) updateData.notes = notes
  if (source !== undefined) updateData.source = source

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: updateData,
    include: {
      tags: { include: { tag: true } },
    },
  })

  // Update tags if provided
  if (tags !== undefined) {
    // Remove existing tags
    await prisma.customerTag.deleteMany({ where: { customerId: params.id } })
    // Add new tags
    for (const tagName of tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {},
      })
      await prisma.customerTag.create({
        data: { customerId: params.id, tagId: tag.id },
      })
    }
  }

  // Log activity
  await prisma.activity.create({
    data: {
      type: 'CUSTOMER_UPDATED',
      description: `Customer updated: ${customer.name || customer.phone}`,
      customerId: customer.id,
      metadata: JSON.stringify({ fields: Object.keys(updateData) }),
    },
  })

  const result = await prisma.customer.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  })

  return NextResponse.json(result)
}

// DELETE /api/customers/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth()
  if (error) return error

  await prisma.customer.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
