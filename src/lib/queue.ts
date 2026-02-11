import { Queue } from 'bullmq'
import IORedis from 'ioredis'

let connection: IORedis | null = null

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
  }
  return connection
}

// Queue definitions
export const automationQueue = new Queue('automation', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

export const aiAnalysisQueue = new Queue('ai-analysis', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
})

export const followUpQueue = new Queue('follow-up', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

// Job types
export interface AutomationJobData {
  automationId: string
  customerId: string
  trigger: string
  triggerData?: any
}

export interface AIAnalysisJobData {
  customerId: string
  trigger: string
}

export interface FollowUpJobData {
  followUpId: string
  customerId: string
  content: string
  type: string
}
