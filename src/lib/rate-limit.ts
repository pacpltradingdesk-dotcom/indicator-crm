const rateMap = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  rateMap.forEach((val, key) => {
    if (val.resetAt < now) rateMap.delete(key)
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number
  max: number
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  api: { windowMs: 60_000, max: 100 },
  message: { windowMs: 60_000, max: 30 },
  ai: { windowMs: 60_000, max: 10 },
  webhook: { windowMs: 60_000, max: 200 },
  auth: { windowMs: 15 * 60_000, max: 10 },
}

export function checkRateLimit(identifier: string, type: keyof typeof DEFAULTS = 'api'): { allowed: boolean; remaining: number; resetAt: number } {
  const config = DEFAULTS[type]
  const key = `${type}:${identifier}`
  const now = Date.now()

  const entry = rateMap.get(key)
  if (!entry || entry.resetAt < now) {
    rateMap.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs }
  }

  entry.count++
  if (entry.count > config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt }
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  }
}
