'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Search, Phone, User, Clock, CheckCheck, Check, MessageSquare } from 'lucide-react'
import { formatPhone, timeAgo, getInitials, getTemperatureColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Conversation {
  id: string
  name: string | null
  phone: string
  lastMessageAt: string | null
  leadTemperature: string
  totalMessages: number
  lastMessage?: string
}

interface Message {
  id: string
  direction: 'INBOUND' | 'OUTBOUND'
  content: string
  type: string
  status: string
  createdAt: string
  templateName?: string
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const preselectedCustomer = searchParams.get('customer')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(preselectedCustomer)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [customerDetail, setCustomerDetail] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations
  useEffect(() => {
    fetch('/api/customers?limit=100&sortBy=lastMessageAt&sortOrder=desc&fields=minimal')
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.customers?.filter((c: any) => c.totalMessages > 0 || c.id === preselectedCustomer) || [])
      })
  }, [preselectedCustomer])

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedId) return
    fetch(`/api/messages?customerId=${selectedId}&limit=100`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
    fetch(`/api/customers/${selectedId}`)
      .then((r) => r.json())
      .then(setCustomerDetail)
  }, [selectedId])

  // SSE for real-time messages
  useEffect(() => {
    const es = new EventSource('/api/sse?channel=chat')

    es.addEventListener('new-message', (e) => {
      const msg = JSON.parse(e.data)
      if (msg.customerId === selectedId) {
        setMessages((prev) => [...prev, msg])
      }
      // Update conversation list
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.customer?.id || c.id === msg.customerId)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = { ...updated[idx], lastMessageAt: msg.createdAt, lastMessage: msg.content }
          return [updated[idx], ...updated.filter((_, i) => i !== idx)]
        }
        return prev
      })
    })

    es.addEventListener('message-status', (e) => {
      const { whatsappMsgId, status } = JSON.parse(e.data)
      setMessages((prev) => prev.map((m) =>
        m.id === whatsappMsgId ? { ...m, status } : m
      ))
    })

    return () => es.close()
  }, [selectedId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedId || sending) return

    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: selectedId, content: newMessage }),
    })

    if (res.ok) {
      const msg = await res.json()
      setMessages((prev) => [...prev, msg])
      setNewMessage('')
    } else {
      toast.error('Failed to send message')
    }
    setSending(false)
  }

  const filteredConversations = conversations.filter((c) =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-4 lg:-m-6 bg-card">
      {/* Left: Conversation List */}
      <div className="w-80 border-r border-border flex-col hidden md:flex">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-border hover:bg-accent/50 ${
                selectedId === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                {getInitials(conv.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{conv.name || formatPhone(conv.phone)}</p>
                  <span className="text-xs text-muted-foreground">{conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{(conv as any).lastMessage || formatPhone(conv.phone)}</p>
              </div>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                conv.leadTemperature === 'HOT' ? 'bg-red-500' :
                conv.leadTemperature === 'WARM' ? 'bg-orange-500' : 'bg-blue-500'
              }`} />
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No conversations</p>
          )}
        </ScrollArea>
      </div>

      {/* Center: Chat Thread */}
      <div className="flex-1 flex flex-col">
        {selectedId ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {getInitials(customerDetail?.name)}
              </div>
              <div>
                <p className="font-medium">{customerDetail?.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{customerDetail?.phone ? formatPhone(customerDetail.phone) : ''}</p>
              </div>
              <div className="ml-auto flex gap-2">
                {customerDetail?.leadTemperature && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTemperatureColor(customerDetail.leadTemperature)}`}>
                    {customerDetail.leadTemperature}
                  </span>
                )}
                <Badge variant="outline">{customerDetail?.leadStage}</Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
                    msg.direction === 'OUTBOUND'
                      ? 'bg-green-100 text-foreground'
                      : 'bg-card text-foreground'
                  }`}>
                    {msg.templateName && (
                      <p className="text-xs text-muted-foreground mb-1">Template: {msg.templateName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.direction === 'OUTBOUND' && (
                        <span className="text-muted-foreground">
                          {msg.status === 'READ' ? <CheckCheck className="h-3 w-3 text-blue-500" /> :
                           msg.status === 'DELIVERED' ? <CheckCheck className="h-3 w-3" /> :
                           msg.status === 'SENT' ? <Check className="h-3 w-3" /> :
                           <Clock className="h-3 w-3" />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-border bg-card flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" disabled={!newMessage.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Contact Info */}
      {selectedId && customerDetail && (
        <div className="w-72 border-l border-border bg-card p-4 overflow-y-auto hidden lg:block">
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-medium text-primary mx-auto mb-2">
              {getInitials(customerDetail.name)}
            </div>
            <p className="font-medium">{customerDetail.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground font-mono">{formatPhone(customerDetail.phone)}</p>
          </div>

          <div className="space-y-3 text-sm">
            {customerDetail.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{customerDetail.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{formatPhone(customerDetail.phone)}</span>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score</span>
                <span className="font-medium">{customerDetail.leadScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-medium">{customerDetail.totalMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">₹{customerDetail.totalSpent?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline">{customerDetail.source}</Badge>
              </div>
            </div>

            {customerDetail.tags?.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {customerDetail.tags.map((ct: any) => (
                    <Badge key={ct.id} variant="secondary" className="text-xs">{ct.tag.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {customerDetail.aiSummary && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-1">AI Summary</p>
                <p className="text-xs text-foreground">{customerDetail.aiSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
