import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { validateBody, createAutomationSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const automations = await prisma.automation.findMany({
    include: {
      steps: { orderBy: { order: 'asc' } },
      _count: { select: { runs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(automations)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()
  const validation = validateBody(createAutomationSchema, body)
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
  const { name, description, trigger, triggerConfig, steps, isActive } = validation.data

  const automation = await prisma.automation.create({
    data: {
      name,
      description: description || null,
      trigger,
      triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : null,
      isActive: isActive !== false,
      steps: steps?.length
        ? {
            create: steps.map((step: any, i: number) => ({
              type: step.type,
              config: typeof step.config === 'string' ? step.config : JSON.stringify(step.config || {}),
              order: i,
              nextStepId: step.nextStepId || null,
              conditionTrue: step.conditionTrue || null,
              conditionFalse: step.conditionFalse || null,
            })),
          }
        : undefined,
    },
    include: { steps: { orderBy: { order: 'asc' } } },
  })

  await prisma.activity.create({
    data: {
      type: 'AUTOMATION_CREATED',
      description: `Automation created: ${name}`,
    },
  })

  return NextResponse.json(automation, { status: 201 })
}
