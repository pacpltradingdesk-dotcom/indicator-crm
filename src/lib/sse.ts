type SSEClient = {
  id: string
  controller: ReadableStreamDefaultController
}

class SSEManager {
  private clients: Map<string, SSEClient[]> = new Map()

  addClient(channel: string, client: SSEClient) {
    if (!this.clients.has(channel)) {
      this.clients.set(channel, [])
    }
    this.clients.get(channel)!.push(client)
  }

  removeClient(channel: string, clientId: string) {
    const channelClients = this.clients.get(channel)
    if (channelClients) {
      this.clients.set(
        channel,
        channelClients.filter((c) => c.id !== clientId)
      )
    }
  }

  broadcast(channel: string, event: string, data: any) {
    const channelClients = this.clients.get(channel) || []
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

    channelClients.forEach((client) => {
      try {
        client.controller.enqueue(new TextEncoder().encode(message))
      } catch {
        this.removeClient(channel, client.id)
      }
    })
  }

  broadcastAll(event: string, data: any) {
    this.clients.forEach((_, channel) => {
      this.broadcast(channel, event, data)
    })
  }
}

// Global singleton
const globalForSSE = globalThis as unknown as { sseManager: SSEManager }
export const sseManager = globalForSSE.sseManager || new SSEManager()
if (process.env.NODE_ENV !== 'production') globalForSSE.sseManager = sseManager
