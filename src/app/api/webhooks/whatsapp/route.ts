import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppClient } from '@/lib/whatsapp'
import { normalizePhone } from '@/lib/utils'
import { sseManager } from '@/lib/sse'
import { aiAnalysisQueue, automationQueue } from '@/lib/queue'

// GET - Webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// POST - Incoming messages/status updates
export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = WhatsAppClient.parseWebhookPayload(body)

  if (!parsed) {
    return NextResponse.json({ status: 'ok' })
  }

  // Process incoming messages
  for (const msg of parsed.messages) {
    const phone = normalizePhone(msg.from)
    const contactInfo = parsed.contacts.find((c: any) => c.waId === msg.from)

    // Upsert customer
    let customer = await prisma.customer.findUnique({ where: { phone } })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone,
          name: contactInfo?.name || null,
          whatsappId: msg.from,
          source: 'WHATSAPP',
          leadStage: 'NEW',
          leadTemperature: 'WARM',
        },
      })

      await prisma.activity.create({
        data: {
          type: 'CUSTOMER_CREATED',
          description: `New lead from WhatsApp: ${contactInfo?.name || phone}`,
          customerId: customer.id,
        },
      })

      // Trigger customer created automation
      try {
        await automationQueue.add('trigger', {
          trigger: 'CUSTOMER_CREATED',
          customerId: customer.id,
          triggerData: { source: 'WHATSAPP' },
        })
      } catch (e) {
        // Redis may not be available
      }
    } else if (contactInfo?.name && !customer.name) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name: contactInfo.name, whatsappId: msg.from },
      })
    }

    // Determine content and message type
    let content = msg.text || ''
    let messageType = 'TEXT'
    let mediaUrl: string | undefined

    switch (msg.type) {
      case 'image':
        messageType = 'IMAGE'
        content = msg.image?.caption || '[Image]'
        mediaUrl = msg.image?.id
        break
      case 'document':
        messageType = 'DOCUMENT'
        content = msg.document?.caption || '[Document]'
        mediaUrl = msg.document?.id
        break
      case 'audio':
        messageType = 'AUDIO'
        content = '[Audio]'
        mediaUrl = msg.audio?.id
        break
      case 'video':
        messageType = 'VIDEO'
        content = msg.video?.caption || '[Video]'
        mediaUrl = msg.video?.id
        break
      case 'location':
        messageType = 'LOCATION'
        content = `[Location: ${msg.location?.latitude}, ${msg.location?.longitude}]`
        break
      case 'interactive':
        messageType = 'INTERACTIVE'
        content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive]'
        break
    }

    // Store message
    const message = await prisma.message.create({
      data: {
        customerId: customer.id,
        direction: 'INBOUND',
        type: messageType as any,
        content,
        mediaUrl,
        whatsappMsgId: msg.id,
        status: 'DELIVERED',
        metadata: JSON.stringify({ raw: msg }),
      },
    })

    // Update customer stats
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalMessages: { increment: 1 },
        lastMessageAt: new Date(),
        leadStage: customer.leadStage === 'NEW' ? 'ENGAGED' : customer.leadStage,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'MESSAGE_RECEIVED',
        description: `Message from ${customer.name || phone}: ${content.slice(0, 100)}`,
        customerId: customer.id,
      },
    })

    // SSE broadcast for real-time chat
    sseManager.broadcast('chat', 'new-message', {
      ...message,
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
    })

    sseManager.broadcastAll('activity', {
      type: 'MESSAGE_RECEIVED',
      customerId: customer.id,
      customerName: customer.name || phone,
      content: content.slice(0, 100),
    })

    // Trigger AI analysis every 3 messages
    if (updatedCustomer.totalMessages % 3 === 0) {
      try {
        await aiAnalysisQueue.add('analyze', {
          customerId: customer.id,
          trigger: 'message_count',
        })
      } catch (e) {
        // Redis may not be available
      }
    }

    // Trigger message received automation
    try {
      await automationQueue.add('trigger', {
        trigger: 'MESSAGE_RECEIVED',
        customerId: customer.id,
        triggerData: { messageId: message.id, content, type: messageType },
      })
    } catch (e) {
      // Redis may not be available
    }

    // Mark as read
    try {
      const wa = new WhatsAppClient()
      await wa.markAsRead(msg.id)
    } catch (e) {
      // Non-critical
    }
  }

  // Process status updates
  for (const status of parsed.statuses) {
    const statusMap: Record<string, string> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    }

    if (statusMap[status.status]) {
      await prisma.message.updateMany({
        where: { whatsappMsgId: status.id },
        data: { status: statusMap[status.status] as any },
      })

      sseManager.broadcast('chat', 'message-status', {
        whatsappMsgId: status.id,
        status: statusMap[status.status],
      })
    }
  }

  return NextResponse.json({ status: 'ok' })
}
