const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

interface SendMessageOptions {
  to: string
  type?: 'text' | 'template' | 'image' | 'document'
  text?: string
  templateName?: string
  templateLanguage?: string
  templateParams?: string[]
  mediaUrl?: string
  caption?: string
}

interface WhatsAppResponse {
  messaging_product: string
  contacts: { input: string; wa_id: string }[]
  messages: { id: string }[]
}

export class WhatsAppClient {
  private accessToken: string
  private phoneNumberId: string

  constructor(accessToken?: string, phoneNumberId?: string) {
    this.accessToken = accessToken || process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.phoneNumberId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  }

  private async request(endpoint: string, body: any): Promise<any> {
    const res = await fetch(`${WHATSAPP_API_URL}/${this.phoneNumberId}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`)
    }
    return res.json()
  }

  async sendText(to: string, text: string): Promise<WhatsAppResponse> {
    return this.request('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    })
  }

  async sendTemplate(
    to: string,
    templateName: string,
    language = 'en',
    params?: string[]
  ): Promise<WhatsAppResponse> {
    const components: any[] = []
    if (params?.length) {
      components.push({
        type: 'body',
        parameters: params.map((p) => ({ type: 'text', text: p })),
      })
    }
    return this.request('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: components.length ? components : undefined,
      },
    })
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResponse> {
    return this.request('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption },
    })
  }

  async sendDocument(to: string, documentUrl: string, filename: string, caption?: string): Promise<WhatsAppResponse> {
    return this.request('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: { link: documentUrl, filename, caption },
    })
  }

  async sendMessage(options: SendMessageOptions): Promise<WhatsAppResponse> {
    switch (options.type || 'text') {
      case 'text':
        return this.sendText(options.to, options.text!)
      case 'template':
        return this.sendTemplate(options.to, options.templateName!, options.templateLanguage, options.templateParams)
      case 'image':
        return this.sendImage(options.to, options.mediaUrl!, options.caption)
      case 'document':
        return this.sendDocument(options.to, options.mediaUrl!, options.caption || 'document', options.caption)
      default:
        return this.sendText(options.to, options.text!)
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.request('/messages', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    })
  }

  static parseWebhookPayload(body: any) {
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value) return null

    const messages = value.messages || []
    const statuses = value.statuses || []
    const contacts = value.contacts || []

    return {
      messages: messages.map((msg: any) => ({
        id: msg.id,
        from: msg.from,
        timestamp: msg.timestamp,
        type: msg.type,
        text: msg.text?.body,
        image: msg.image,
        document: msg.document,
        audio: msg.audio,
        video: msg.video,
        interactive: msg.interactive,
        location: msg.location,
        contacts: msg.contacts,
      })),
      statuses: statuses.map((s: any) => ({
        id: s.id,
        recipientId: s.recipient_id,
        status: s.status,
        timestamp: s.timestamp,
        errors: s.errors,
      })),
      contacts: contacts.map((c: any) => ({
        waId: c.wa_id,
        name: c.profile?.name,
      })),
    }
  }
}

export const whatsapp = new WhatsAppClient()
