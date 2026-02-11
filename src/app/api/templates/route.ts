import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { validateBody, createTemplateSchema } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const templates = await prisma.messageTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const rl = checkRateLimit(ip, 'api')
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const body = await req.json()
  const validation = validateBody(createTemplateSchema, body)
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
  const { name, language, category, content, headerType, headerContent, footerContent, buttons, variables } = validation.data

  const template = await prisma.messageTemplate.create({
    data: {
      name,
      language: language || 'en',
      category: category || 'MARKETING',
      content,
      headerType: headerType || null,
      headerContent: headerContent || null,
      footerContent: footerContent || null,
      buttons: buttons ? JSON.stringify(buttons) : null,
      variables: variables ? JSON.stringify(variables) : '[]',
    },
  })

  return NextResponse.json(template, { status: 201 })
}
