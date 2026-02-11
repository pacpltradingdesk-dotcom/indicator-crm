import { NextRequest } from 'next/server'
import { sseManager } from '@/lib/sse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Auth check for SSE - can't use requireAuth since we return a stream
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const channel = searchParams.get('channel') || 'default'
  const clientId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addClient(channel, { id: clientId, controller })

      // Send initial connection event
      const connectMsg = `event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`
      controller.enqueue(new TextEncoder().encode(connectMsg))

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        sseManager.removeClient(channel, clientId)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
