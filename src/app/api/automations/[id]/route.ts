import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { validateBody, updateAutomationSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const automation = await prisma.automation.findUnique({
    where: { id: params.id },
    include: {
      steps: { orderBy: { order: 'asc' } },
      runs: {
        orderBy: { startedAt: 'desc' },
        take: 20,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          logs: { orderBy: { executedAt: 'asc' } },
        },
      },
    },
  })

  if (!automation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(automation)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()
  const validation = validateBody(updateAutomationSchema, body)
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
  const { name, description, trigger, triggerConfig, isActive, steps } = validation.data

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (trigger !== undefined) updateData.trigger = trigger
  if (triggerConfig !== undefined) updateData.triggerConfig = typeof triggerConfig === 'string' ? triggerConfig : JSON.stringify(triggerConfig)
  if (isActive !== undefined) updateData.isActive = isActive

  // Update steps if provided
  if (steps) {
    await prisma.automationStep.deleteMany({ where: { automationId: params.id } })
    await prisma.automationStep.createMany({
      data: steps.map((step: any, i: number) => ({
        automationId: params.id,
        type: step.type,
        config: typeof step.config === 'string' ? step.config : JSON.stringify(step.config || {}),
        order: i,
        nextStepId: step.nextStepId || null,
        conditionTrue: step.conditionTrue || null,
        conditionFalse: step.conditionFalse || null,
      })),
    })
  }

  const automation = await prisma.automation.update({
    where: { id: params.id },
    data: updateData,
    include: { steps: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(automation)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth()
  if (error) return error

  await prisma.automation.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
