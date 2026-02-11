import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { validateBody, bulkUpdateSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()
  const validation = validateBody(bulkUpdateSchema, body)
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
  const { customerIds, action, value } = validation.data

  let affected = 0

  switch (action) {
    case 'CHANGE_STAGE':
      if (!value) return NextResponse.json({ error: 'Stage value required' }, { status: 400 })
      const stageResult = await prisma.customer.updateMany({
        where: { id: { in: customerIds } },
        data: { leadStage: value },
      })
      affected = stageResult.count
      break

    case 'CHANGE_TEMPERATURE':
      if (!value) return NextResponse.json({ error: 'Temperature value required' }, { status: 400 })
      const tempResult = await prisma.customer.updateMany({
        where: { id: { in: customerIds } },
        data: { leadTemperature: value },
      })
      affected = tempResult.count
      break

    case 'ADD_TAG':
      if (!value) return NextResponse.json({ error: 'Tag name required' }, { status: 400 })
      const tag = await prisma.tag.upsert({
        where: { name: value },
        create: { name: value },
        update: {},
      })
      for (const customerId of customerIds) {
        const existing = await prisma.customerTag.findFirst({
          where: { customerId, tagId: tag.id },
        })
        if (!existing) {
          await prisma.customerTag.create({ data: { customerId, tagId: tag.id } })
          affected++
        }
      }
      break

    case 'REMOVE_TAG':
      if (!value) return NextResponse.json({ error: 'Tag name required' }, { status: 400 })
      const tagToRemove = await prisma.tag.findUnique({ where: { name: value } })
      if (tagToRemove) {
        const removeResult = await prisma.customerTag.deleteMany({
          where: { customerId: { in: customerIds }, tagId: tagToRemove.id },
        })
        affected = removeResult.count
      }
      break

    case 'DELETE':
      const deleteResult = await prisma.customer.deleteMany({
        where: { id: { in: customerIds } },
      })
      affected = deleteResult.count
      break
  }

  await prisma.activity.create({
    data: {
      type: 'BULK_ACTION',
      description: `Bulk ${action} on ${affected} customers${value ? ': ' + value : ''}`,
    },
  })

  return NextResponse.json({ success: true, affected })
}
