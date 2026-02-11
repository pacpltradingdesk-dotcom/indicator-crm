import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/utils'
import { automationQueue } from '@/lib/queue'
import { sseManager } from '@/lib/sse'

// POST /api/webhooks/website - Lead capture from website
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { phone, name, email, message, interestedProduct, source } = body

  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
  }

  const normalizedPhone = normalizePhone(phone)

  // Upsert customer
  let customer = await prisma.customer.findUnique({ where: { phone: normalizedPhone } })
  const isNew = !customer

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        phone: normalizedPhone,
        name: name || null,
        email: email || null,
        source: 'WEBSITE',
        leadStage: 'NEW',
        leadTemperature: 'WARM',
        notes: message || null,
        interestedProducts: interestedProduct ? JSON.stringify([interestedProduct]) : '[]',
      },
    })
  } else {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: name || customer.name,
        email: email || customer.email,
        notes: message ? `${customer.notes || ''}\n[Website] ${message}`.trim() : customer.notes,
        interestedProducts: interestedProduct
          ? JSON.stringify([...JSON.parse(customer.interestedProducts || '[]'), interestedProduct])
          : undefined,
      },
    })
  }

  // Add website_lead tag
  const tag = await prisma.tag.upsert({
    where: { name: 'website_lead' },
    create: { name: 'website_lead', color: '#3b82f6' },
    update: {},
  })

  await prisma.customerTag.upsert({
    where: { customerId_tagId: { customerId: customer.id, tagId: tag.id } },
    create: { customerId: customer.id, tagId: tag.id },
    update: {},
  })

  // Log activity
  await prisma.activity.create({
    data: {
      type: 'WEBSITE_LEAD',
      description: `Website lead: ${name || normalizedPhone}${interestedProduct ? ` - interested in ${interestedProduct}` : ''}`,
      customerId: customer.id,
    },
  })

  // SSE broadcast
  sseManager.broadcastAll('activity', {
    type: 'WEBSITE_LEAD',
    customerId: customer.id,
    customerName: customer.name || normalizedPhone,
  })

  // Queue automation
  try {
    if (isNew) {
      await automationQueue.add('trigger', {
        trigger: 'CUSTOMER_CREATED',
        customerId: customer.id,
        triggerData: { source: 'WEBSITE' },
      })
    }
  } catch (e) {
    // Redis may not be available
  }

  // Return CORS-friendly response for embedding
  return NextResponse.json(
    { status: 'ok', message: 'Lead captured successfully' },
    {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
