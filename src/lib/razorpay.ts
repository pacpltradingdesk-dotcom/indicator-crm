import crypto from 'crypto'

export function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export interface RazorpayPaymentPayload {
  entity: string
  account_id: string
  event: string
  contains: string[]
  payload: {
    payment: {
      entity: {
        id: string
        amount: number
        currency: string
        status: string
        order_id: string | null
        method: string
        description: string | null
        email: string
        contact: string
        notes: Record<string, string>
        created_at: number
      }
    }
  }
}

export function parseRazorpayPayment(payload: RazorpayPaymentPayload) {
  const payment = payload.payload.payment.entity
  return {
    paymentId: payment.id,
    orderId: payment.order_id,
    amount: payment.amount / 100, // Convert from paise to rupees
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    email: payment.email,
    phone: payment.contact?.replace(/[^0-9]/g, ''),
    description: payment.description,
    notes: payment.notes,
    paidAt: new Date(payment.created_at * 1000),
  }
}
