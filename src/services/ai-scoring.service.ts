import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface AIAnalysisResult {
  leadScore: number
  temperature: 'HOT' | 'WARM' | 'COLD' | 'DEAD'
  stageRecommendation: string
  tags: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  summary: string
  recommendedAction: string
  tradingExperience: string
  interestedProducts: string[]
  preferredMarkets: string[]
}

const SYSTEM_PROMPT = `You are an AI lead scoring assistant for a TradingView Pine Script indicators business.
Analyze the customer's WhatsApp conversation and provide insights.

You sell trading indicators for Indian and global markets (Nifty, BankNifty, Sensex, Crude, Gold, Forex, Crypto).

Score leads 0-100 based on:
- Purchase intent signals (asking about price, features, demos) = +20-40
- Engagement level (response time, message frequency) = +10-20
- Trading experience mentions = +5-15
- Urgency signals (need immediately, market is moving) = +10-20
- Budget signals (mentioning willingness to pay) = +10-20
- Negative signals (just browsing, too expensive, not interested) = -20-40

Return ONLY valid JSON with this structure:
{
  "leadScore": number (0-100),
  "temperature": "HOT" | "WARM" | "COLD" | "DEAD",
  "stageRecommendation": "NEW" | "ENGAGED" | "INTERESTED" | "NEGOTIATION" | "CONVERTED" | "CHURNED",
  "tags": ["array", "of", "relevant", "tags"],
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "2-3 line summary of the lead",
  "recommendedAction": "What the sales team should do next",
  "tradingExperience": "beginner" | "intermediate" | "advanced" | "unknown",
  "interestedProducts": ["products they mentioned interest in"],
  "preferredMarkets": ["markets they trade or are interested in"]
}`

export async function analyzeCustomer(customerId: string): Promise<AIAnalysisResult | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      payments: true,
      tags: { include: { tag: true } },
    },
  })

  if (!customer || customer.messages.length === 0) return null

  const conversationText = customer.messages
    .reverse()
    .map((m) => `[${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}] ${m.content}`)
    .join('\n')

  const context = `
Customer: ${customer.name || 'Unknown'} (${customer.phone})
Source: ${customer.source}
Current Stage: ${customer.leadStage}
Total Messages: ${customer.totalMessages}
Total Spent: ₹${customer.totalSpent}
Existing Tags: ${customer.tags.map((t) => t.tag.name).join(', ') || 'none'}

Conversation:
${conversationText}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: context },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}') as AIAnalysisResult

    // Update customer with AI analysis
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        leadScore: result.leadScore,
        leadTemperature: result.temperature,
        aiSummary: result.summary,
        tradingExperience: result.tradingExperience,
        interestedProducts: JSON.stringify(result.interestedProducts || []),
        preferredMarkets: JSON.stringify(result.preferredMarkets || []),
      },
    })

    // Auto-tag customer
    for (const tagName of result.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        create: { name: tagName, isAiGenerated: true },
        update: {},
      })
      await prisma.customerTag.upsert({
        where: { customerId_tagId: { customerId, tagId: tag.id } },
        create: { customerId, tagId: tag.id, aiConfidence: result.leadScore / 100 },
        update: { aiConfidence: result.leadScore / 100 },
      })
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'AI_ANALYSIS',
        description: `AI Score: ${result.leadScore}/100 | ${result.temperature} | ${result.summary.slice(0, 100)}`,
        customerId,
        metadata: JSON.stringify(result),
      },
    })

    return result
  } catch (error: any) {
    console.error('AI Analysis error:', error.message)
    return null
  }
}
