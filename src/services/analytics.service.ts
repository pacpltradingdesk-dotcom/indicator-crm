import { prisma } from '@/lib/prisma'

export async function getDashboardStats() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalCustomers,
    hotLeads,
    converted,
    totalRevenue,
    activeConversations,
    newLeadsThisWeek,
    revenueThisMonth,
    messageStats,
    sourceDistribution,
    stageDistribution,
    recentActivities,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { leadTemperature: 'HOT' } }),
    prisma.customer.count({ where: { leadStage: 'CONVERTED' } }),
    prisma.payment.aggregate({
      where: { status: 'CAPTURED' },
      _sum: { amount: true },
    }),
    prisma.customer.count({
      where: { lastMessageAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.customer.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.payment.aggregate({
      where: { status: 'CAPTURED', paidAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.message.groupBy({
      by: ['direction'],
      _count: true,
    }),
    prisma.customer.groupBy({
      by: ['source'],
      _count: true,
    }),
    prisma.customer.groupBy({
      by: ['leadStage'],
      _count: true,
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { customer: { select: { id: true, name: true, phone: true } } },
    }),
  ])

  return {
    stats: {
      totalCustomers,
      hotLeads,
      converted,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeConversations,
      newLeadsThisWeek,
      revenueThisMonth: revenueThisMonth._sum.amount || 0,
    },
    messageStats: messageStats.reduce((acc, s) => {
      acc[s.direction] = s._count
      return acc
    }, {} as Record<string, number>),
    sourceDistribution: sourceDistribution.map((s) => ({
      name: s.source,
      value: s._count,
    })),
    stageDistribution: stageDistribution.map((s) => ({
      name: s.leadStage,
      value: s._count,
    })),
    recentActivities,
  }
}

export async function getRevenueOverTime(days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const payments = await prisma.payment.findMany({
    where: { status: 'CAPTURED', paidAt: { gte: startDate } },
    select: { amount: true, paidAt: true },
    orderBy: { paidAt: 'asc' },
  })

  const grouped: Record<string, number> = {}
  payments.forEach((p) => {
    if (p.paidAt) {
      const date = p.paidAt.toISOString().split('T')[0]
      grouped[date] = (grouped[date] || 0) + p.amount
    }
  })

  return Object.entries(grouped).map(([date, amount]) => ({ date, amount }))
}

export async function getLeadFunnel() {
  const stages = ['NEW', 'ENGAGED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED']
  const grouped = await prisma.customer.groupBy({
    by: ['leadStage'],
    _count: true,
    where: { leadStage: { in: stages } },
  })

  const countMap = new Map(grouped.map((g) => [g.leadStage, g._count]))
  return stages.map((stage) => ({ stage, count: countMap.get(stage) || 0 }))
}
