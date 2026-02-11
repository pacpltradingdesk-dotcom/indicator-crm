import { Worker, Job } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import { WhatsAppClient } from '../lib/whatsapp'

const prisma = new PrismaClient()
const whatsapp = new WhatsAppClient()

interface AutomationJobData {
  trigger: string
  customerId: string
  triggerData?: any
  // For step execution
  workflowRunId?: string
  stepId?: string
}

async function processAutomationTrigger(job: Job<AutomationJobData>) {
  const { trigger, customerId, triggerData } = job.data

  // Find matching active automations
  const automations = await prisma.automation.findMany({
    where: { trigger: trigger as any, isActive: true },
    include: { steps: { orderBy: { order: 'asc' } } },
  })

  for (const automation of automations) {
    if (automation.steps.length === 0) continue

    // Check if already running for this customer
    const existingRun = await prisma.workflowRun.findFirst({
      where: {
        automationId: automation.id,
        customerId,
        status: { in: ['RUNNING', 'PAUSED', 'WAITING'] },
      },
    })

    if (existingRun) continue

    // Create workflow run
    const run = await prisma.workflowRun.create({
      data: {
        automationId: automation.id,
        customerId,
        status: 'RUNNING',
        currentStepId: automation.steps[0].id,
        context: JSON.stringify(triggerData || {}),
      },
    })

    // Execute first step
    await executeStep(run.id, automation.steps[0].id)
  }
}

async function executeStep(workflowRunId: string, stepId: string) {
  const run = await prisma.workflowRun.findUnique({
    where: { id: workflowRunId },
    include: {
      customer: true,
      automation: { include: { steps: { orderBy: { order: 'asc' } } } },
    },
  })

  if (!run || run.status === 'CANCELLED' || run.status === 'COMPLETED') return

  const step = run.automation.steps.find((s) => s.id === stepId)
  if (!step) {
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
    return
  }

  const config = typeof step.config === 'string' ? JSON.parse(step.config) : step.config
  let success = true
  let output: any = {}
  let error: string | undefined

  try {
    switch (step.type) {
      case 'SEND_TEXT': {
        const text = replaceVariables(config.text || '', run.customer)
        const result = await whatsapp.sendText(run.customer.phone, text)
        await prisma.message.create({
          data: {
            customerId: run.customer.id,
            direction: 'OUTBOUND',
            type: 'TEXT',
            content: text,
            whatsappMsgId: result.messages?.[0]?.id,
            status: 'SENT',
          },
        })
        output = { messageId: result.messages?.[0]?.id }
        break
      }

      case 'SEND_TEMPLATE': {
        const result = await whatsapp.sendTemplate(
          run.customer.phone,
          config.templateName,
          config.language || 'en',
          config.params
        )
        await prisma.message.create({
          data: {
            customerId: run.customer.id,
            direction: 'OUTBOUND',
            type: 'TEMPLATE',
            content: `[Template: ${config.templateName}]`,
            templateName: config.templateName,
            whatsappMsgId: result.messages?.[0]?.id,
            status: 'SENT',
          },
        })
        output = { messageId: result.messages?.[0]?.id }
        break
      }

      case 'WAIT': {
        const delayMs = (config.minutes || 0) * 60 * 1000 +
          (config.hours || 0) * 60 * 60 * 1000 +
          (config.days || 0) * 24 * 60 * 60 * 1000

        await prisma.workflowRun.update({
          where: { id: workflowRunId },
          data: { status: 'PAUSED', currentStepId: stepId },
        })

        // Schedule next step after delay
        const nextStep = getNextStep(run.automation.steps, step)
        if (nextStep) {
          setTimeout(() => executeStep(workflowRunId, nextStep.id), delayMs)
        }
        return // Don't continue to next step immediately
      }

      case 'WAIT_FOR_REPLY': {
        await prisma.workflowRun.update({
          where: { id: workflowRunId },
          data: { status: 'WAITING', currentStepId: stepId },
        })
        return // Will be resumed when message received
      }

      case 'ADD_TAG': {
        const tag = await prisma.tag.upsert({
          where: { name: config.tagName },
          create: { name: config.tagName },
          update: {},
        })
        await prisma.customerTag.upsert({
          where: { customerId_tagId: { customerId: run.customer.id, tagId: tag.id } },
          create: { customerId: run.customer.id, tagId: tag.id },
          update: {},
        })
        output = { tagId: tag.id }
        break
      }

      case 'CHANGE_STAGE': {
        await prisma.customer.update({
          where: { id: run.customer.id },
          data: { leadStage: config.stage },
        })
        output = { newStage: config.stage }
        break
      }

      case 'AI_ANALYZE': {
        // Import dynamically to avoid circular deps
        const { analyzeCustomer } = await import('../services/ai-scoring.service')
        const result = await analyzeCustomer(run.customer.id)
        output = result || { error: 'No analysis result' }
        break
      }

      case 'NOTIFY_ADMIN': {
        await prisma.activity.create({
          data: {
            type: 'ADMIN_NOTIFICATION',
            description: replaceVariables(config.message || 'Automation notification', run.customer),
            customerId: run.customer.id,
          },
        })
        break
      }

      case 'SCHEDULE_CALL': {
        await prisma.scheduledFollowUp.create({
          data: {
            customerId: run.customer.id,
            type: 'CALL_REMINDER',
            content: config.notes || 'Follow up call',
            scheduledAt: new Date(Date.now() + (config.delayHours || 1) * 60 * 60 * 1000),
          },
        })
        break
      }

      case 'CONDITIONAL_BRANCH': {
        const customer = await prisma.customer.findUnique({ where: { id: run.customer.id } })
        let conditionMet = false

        if (config.field && customer) {
          const value = (customer as any)[config.field]
          switch (config.operator) {
            case 'equals': conditionMet = value === config.value; break
            case 'contains': conditionMet = String(value).includes(config.value); break
            case 'gt': conditionMet = Number(value) > Number(config.value); break
            case 'lt': conditionMet = Number(value) < Number(config.value); break
            case 'in': conditionMet = config.value?.includes(value); break
          }
        }

        const nextId = conditionMet ? step.conditionTrue : step.conditionFalse
        if (nextId) {
          await executeStep(workflowRunId, nextId)
        }
        return
      }
    }
  } catch (err: any) {
    success = false
    error = err.message
  }

  // Log step execution
  await prisma.workflowRunLog.create({
    data: {
      workflowRunId,
      stepId,
      action: step.type,
      input: config,
      output,
      success,
      error,
    },
  })

  if (!success) {
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: 'FAILED', error, completedAt: new Date() },
    })
    return
  }

  // Move to next step
  const nextStep = getNextStep(run.automation.steps, step)
  if (nextStep) {
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { currentStepId: nextStep.id },
    })
    await executeStep(workflowRunId, nextStep.id)
  } else {
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  }
}

function getNextStep(steps: any[], currentStep: any) {
  if (currentStep.nextStepId) {
    return steps.find((s) => s.id === currentStep.nextStepId)
  }
  const currentIndex = steps.findIndex((s) => s.id === currentStep.id)
  return steps[currentIndex + 1] || null
}

function replaceVariables(text: string, customer: any): string {
  return text
    .replace(/\{\{name\}\}/g, customer.name || 'there')
    .replace(/\{\{phone\}\}/g, customer.phone)
    .replace(/\{\{email\}\}/g, customer.email || '')
    .replace(/\{\{stage\}\}/g, customer.leadStage)
    .replace(/\{\{score\}\}/g, String(customer.leadScore))
}

export function createAutomationWorker(connection: any) {
  return new Worker('automation', async (job) => {
    if (job.name === 'trigger') {
      await processAutomationTrigger(job)
    } else if (job.name === 'execute-step') {
      await executeStep(job.data.workflowRunId, job.data.stepId)
    }
  }, { connection, concurrency: 5 })
}
