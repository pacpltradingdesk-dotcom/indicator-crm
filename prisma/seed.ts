import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@indicatorcrm.com' },
    update: {},
    create: {
      email: 'admin@indicatorcrm.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  })
  console.log('Admin user created:', admin.email)

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-nifty-scalper' },
      update: {},
      create: {
        id: 'prod-nifty-scalper',
        name: 'Nifty Scalper Pro',
        description: 'Advanced scalping indicator for Nifty 50 with real-time buy/sell signals',
        price: 4999,
        category: 'Scalping',
        features: JSON.stringify(['Real-time signals', 'Multi-timeframe', 'Sound alerts', 'Backtesting']),
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-banknifty-options' },
      update: {},
      create: {
        id: 'prod-banknifty-options',
        name: 'BankNifty Options Master',
        description: 'Premium options trading indicator for BankNifty with OI analysis',
        price: 7999,
        category: 'Options',
        features: JSON.stringify(['OI analysis', 'Strike selection', 'Expiry signals', 'Risk management']),
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-swing-trader' },
      update: {},
      create: {
        id: 'prod-swing-trader',
        name: 'Swing Trader Bundle',
        description: 'Complete swing trading system for stocks and indices',
        price: 9999,
        category: 'Swing',
        features: JSON.stringify(['Trend detection', 'Entry/exit signals', 'Position sizing', 'Screener']),
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-crypto-suite' },
      update: {},
      create: {
        id: 'prod-crypto-suite',
        name: 'Crypto Trading Suite',
        description: 'All-in-one crypto trading indicators for BTC, ETH and altcoins',
        price: 5999,
        category: 'Crypto',
        features: JSON.stringify(['Whale alerts', 'Funding rate', 'Liquidation levels', 'Multi-exchange']),
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-ultimate-bundle' },
      update: {},
      create: {
        id: 'prod-ultimate-bundle',
        name: 'Ultimate Trading Bundle',
        description: 'All indicators included - best value for serious traders',
        price: 19999,
        category: 'Bundle',
        features: JSON.stringify(['All indicators', 'Lifetime updates', 'Priority support', '1-on-1 setup']),
      },
    }),
  ])
  console.log('Products created:', products.length)

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: 'interested_in_nifty' }, update: {}, create: { name: 'interested_in_nifty', color: '#3b82f6' } }),
    prisma.tag.upsert({ where: { name: 'interested_in_banknifty' }, update: {}, create: { name: 'interested_in_banknifty', color: '#6366f1' } }),
    prisma.tag.upsert({ where: { name: 'interested_in_crypto' }, update: {}, create: { name: 'interested_in_crypto', color: '#f59e0b' } }),
    prisma.tag.upsert({ where: { name: 'price_sensitive' }, update: {}, create: { name: 'price_sensitive', color: '#ef4444' } }),
    prisma.tag.upsert({ where: { name: 'wants_demo' }, update: {}, create: { name: 'wants_demo', color: '#10b981' } }),
    prisma.tag.upsert({ where: { name: 'urgent_buyer' }, update: {}, create: { name: 'urgent_buyer', color: '#f97316' } }),
    prisma.tag.upsert({ where: { name: 'website_lead' }, update: {}, create: { name: 'website_lead', color: '#8b5cf6' } }),
    prisma.tag.upsert({ where: { name: 'returning_customer' }, update: {}, create: { name: 'returning_customer', color: '#14b8a6' } }),
  ])
  console.log('Tags created:', tags.length)

  // Create sample automation: New Lead Welcome Flow
  await prisma.automation.upsert({
    where: { id: 'auto-welcome' },
    update: {},
    create: {
      id: 'auto-welcome',
      name: 'New Lead Welcome Flow',
      description: 'Automatically welcome new leads from WhatsApp and website',
      trigger: 'CUSTOMER_CREATED',
      isActive: true,
      isTemplate: true,
      steps: {
        create: [
          {
            type: 'SEND_TEXT',
            config: JSON.stringify({ text: 'Hi {{name}}! Welcome to Indicator Trading. We have premium TradingView indicators for Nifty, BankNifty, Crypto and more. How can I help you today?' }),
            order: 0,
          },
          {
            type: 'WAIT_FOR_REPLY',
            config: JSON.stringify({ timeout: 24 }),
            order: 1,
          },
          {
            type: 'AI_ANALYZE',
            config: '{}',
            order: 2,
          },
          {
            type: 'ADD_TAG',
            config: JSON.stringify({ tagName: 'welcomed' }),
            order: 3,
          },
        ],
      },
    },
  })

  // Payment Confirmation Flow
  await prisma.automation.upsert({
    where: { id: 'auto-payment' },
    update: {},
    create: {
      id: 'auto-payment',
      name: 'Payment Confirmation Flow',
      description: 'Confirm payment and send setup instructions',
      trigger: 'PAYMENT_RECEIVED',
      isActive: true,
      isTemplate: true,
      steps: {
        create: [
          {
            type: 'SEND_TEXT',
            config: JSON.stringify({ text: 'Hi {{name}}! Your payment has been received. Thank you for your purchase!' }),
            order: 0,
          },
          {
            type: 'CHANGE_STAGE',
            config: JSON.stringify({ stage: 'CONVERTED' }),
            order: 1,
          },
          {
            type: 'ADD_TAG',
            config: JSON.stringify({ tagName: 'paid_customer' }),
            order: 2,
          },
        ],
      },
    },
  })

  // Create sample customers
  await prisma.customer.upsert({
    where: { phone: '919876543210' },
    update: {},
    create: {
      phone: '919876543210',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      source: 'WHATSAPP',
      leadStage: 'INTERESTED',
      leadTemperature: 'HOT',
      leadScore: 78,
      totalMessages: 12,
      totalSpent: 4999,
      aiSummary: 'Experienced trader interested in Nifty scalping. Has been trading for 3 years. Asking about backtesting results.',
      tradingExperience: 'intermediate',
      interestedProducts: JSON.stringify(['Nifty Scalper Pro']),
      preferredMarkets: JSON.stringify(['Nifty', 'BankNifty']),
    },
  })

  await prisma.customer.upsert({
    where: { phone: '919988776655' },
    update: {},
    create: {
      phone: '919988776655',
      name: 'Priya Patel',
      email: 'priya@example.com',
      source: 'WEBSITE',
      leadStage: 'NEW',
      leadTemperature: 'WARM',
      leadScore: 45,
      totalMessages: 3,
      interestedProducts: JSON.stringify(['Crypto Trading Suite']),
      preferredMarkets: JSON.stringify(['Crypto']),
    },
  })

  await prisma.customer.upsert({
    where: { phone: '918877665544' },
    update: {},
    create: {
      phone: '918877665544',
      name: 'Amit Kumar',
      email: 'amit@example.com',
      source: 'RAZORPAY',
      leadStage: 'CONVERTED',
      leadTemperature: 'HOT',
      leadScore: 92,
      totalMessages: 25,
      totalSpent: 19999,
      tradingExperience: 'advanced',
      interestedProducts: JSON.stringify(['Ultimate Trading Bundle']),
      preferredMarkets: JSON.stringify(['Nifty', 'BankNifty', 'Crude', 'Gold']),
    },
  })

  await prisma.customer.upsert({
    where: { phone: '917766554433' },
    update: {},
    create: {
      phone: '917766554433',
      name: 'Sneha Gupta',
      source: 'WHATSAPP',
      leadStage: 'ENGAGED',
      leadTemperature: 'WARM',
      leadScore: 55,
      totalMessages: 8,
      interestedProducts: JSON.stringify(['BankNifty Options Master']),
      preferredMarkets: JSON.stringify(['BankNifty']),
    },
  })

  await prisma.customer.upsert({
    where: { phone: '916655443322' },
    update: {},
    create: {
      phone: '916655443322',
      name: 'Vikram Singh',
      source: 'MANUAL',
      leadStage: 'NEGOTIATION',
      leadTemperature: 'HOT',
      leadScore: 82,
      totalMessages: 15,
      tradingExperience: 'advanced',
      interestedProducts: JSON.stringify(['Swing Trader Bundle', 'Nifty Scalper Pro']),
      preferredMarkets: JSON.stringify(['Nifty', 'Stocks']),
    },
  })

  console.log('Sample customers created')

  // Create sample activities
  await prisma.activity.createMany({
    data: [
      { type: 'CUSTOMER_CREATED', description: 'New lead from WhatsApp: Rahul Sharma' },
      { type: 'PAYMENT_RECEIVED', description: 'Payment of ₹4,999 received from Rahul Sharma' },
      { type: 'CUSTOMER_CREATED', description: 'New website lead: Priya Patel' },
      { type: 'PAYMENT_RECEIVED', description: 'Payment of ₹19,999 received from Amit Kumar' },
      { type: 'AI_ANALYSIS', description: 'AI Score: 78/100 | HOT | Interested in Nifty scalping' },
      { type: 'AUTOMATION_RUN', description: 'Welcome flow triggered for Sneha Gupta' },
    ],
  })

  console.log('Activities created')
  console.log('\nSeed complete!')
  console.log('Login: admin@indicatorcrm.com / admin123')
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
