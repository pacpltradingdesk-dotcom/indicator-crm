import IORedis from 'ioredis'
import { createAutomationWorker } from './automation.worker'
import { createAIAnalysisWorker } from './ai-analysis.worker'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

console.log('[Workers] Starting workers...')

const automationWorker = createAutomationWorker(connection)
const aiWorker = createAIAnalysisWorker(connection)

automationWorker.on('completed', (job) => {
  console.log(`[Automation] Job ${job.id} completed`)
})

automationWorker.on('failed', (job, err) => {
  console.error(`[Automation] Job ${job?.id} failed:`, err.message)
})

aiWorker.on('completed', (job) => {
  console.log(`[AI] Job ${job.id} completed`)
})

aiWorker.on('failed', (job, err) => {
  console.error(`[AI] Job ${job?.id} failed:`, err.message)
})

console.log('[Workers] All workers started')

process.on('SIGTERM', async () => {
  console.log('[Workers] Shutting down...')
  await automationWorker.close()
  await aiWorker.close()
  await connection.quit()
  process.exit(0)
})
