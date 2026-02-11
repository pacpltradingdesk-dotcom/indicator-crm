import { Worker } from 'bullmq'
import { analyzeCustomer } from '../services/ai-scoring.service'

export function createAIAnalysisWorker(connection: any) {
  return new Worker('ai-analysis', async (job) => {
    const { customerId } = job.data
    console.log(`[AI Worker] Analyzing customer ${customerId}`)
    const result = await analyzeCustomer(customerId)
    if (result) {
      console.log(`[AI Worker] Customer ${customerId}: Score=${result.leadScore}, Temp=${result.temperature}`)
    }
    return result
  }, {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 }, // Rate limit: 10 per minute
  })
}
