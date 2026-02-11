import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRazorpaySignature, parseRazorpayPayment } from '@/lib/razorpay'
import { normalizePhone } from '@/lib/utils'
import { automationQueue, aiAnalysisQueue } from '@/lib/queue'
import { sseManager } from '@/lib/sse'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

  if (secret && !verifyRazorpaySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  if (payload.event !== 'payment.captured' && payload.event !== 'payment.authorized') {
    return NextResponse.json({ status: 'ignored' })
  }

  const parsed = parseRazorpayPayment(payload)
  const phone = normalizePhone(parsed.phone || '')

  if (!phone) {
    return NextResponse.json({ error: 'No phone in payment' }, { status: 400 })
  }

  // Upsert customer
  let customer = await prisma.customer.findUnique({ where: { phone } })
  const isNew = !customer

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        phone,
        email: parsed.email || null,
        source: 'RAZORPAY',
        leadStage: 'CONVERTED',
        leadTemperature: 'HOT',
      },
    })
  }

  // Find matching product by amount or description
  let productId: string | null = null
  if (parsed.description) {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: parsed.description } },
          { price: parsed.amount },
        ],
      },
    })
    productId = product?.id || null
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      customerId: customer.id,
      productId,
      razorpayPaymentId: parsed.paymentId,
      razorpayOrderId: parsed.orderId,
      amount: parsed.amount,
      currency: parsed.currency,
      status: payload.event === 'payment.captured' ? 'CAPTURED' : 'AUTHORIZED',
      method: parsed.method,
      email: parsed.email,
      phone: parsed.phone,
      description: parsed.description,
      paidAt: parsed.paidAt,
      metadata: JSON.stringify(parsed.notes || {}),
    },
  })

  // Update customer stats
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      totalSpent: { increment: parsed.amount },
      lastPaymentAt: parsed.paidAt,
      leadStage: 'CONVERTED',
      leadTemperature: 'HOT',
      email: parsed.email || customer.email,
    },
  })

  // Log activity
  await prisma.activity.create({
    data: {
      type: 'PAYMENT_RECEIVED',
      description: `Payment of ₹${parsed.amount} received from ${customer.name || phone}`,
      customerId: customer.id,
      metadata: JSON.stringify({ amount: parsed.amount, paymentId: parsed.paymentId }),
    },
  })

  // SSE broadcast
  sseManager.broadcastAll('activity', {
    type: 'PAYMENT_RECEIVED',
    customerId: customer.id,
    customerName: customer.name || phone,
    amount: parsed.amount,
  })

  // Queue automations
  try {
    if (isNew) {
      await automationQueue.add('trigger', {
        trigger: 'CUSTOMER_CREATED',
        customerId: customer.id,
        triggerData: { source: 'RAZORPAY' },
      })
    }

    await automationQueue.add('trigger', {
      trigger: 'PAYMENT_RECEIVED',
      customerId: customer.id,
      triggerData: { amount: parsed.amount, paymentId: payment.id },
    })

    await aiAnalysisQueue.add('analyze', {
      customerId: customer.id,
      trigger: 'payment',
    })
  } catch (e) {
    // Redis may not be available
  }

  return NextResponse.json({ status: 'ok', paymentId: payment.id })
}
