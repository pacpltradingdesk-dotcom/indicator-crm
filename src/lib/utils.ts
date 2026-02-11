import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '')
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  }
  // If 10 digits, assume Indian number
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  }
  return cleaned
}

export function formatPhone(phone: string): string {
  if (phone.length === 12 && phone.startsWith('91')) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`
  }
  return `+${phone}`
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getTemperatureColor(temp: string): string {
  switch (temp) {
    case 'HOT': return 'bg-red-100 text-red-800'
    case 'WARM': return 'bg-orange-100 text-orange-800'
    case 'COLD': return 'bg-blue-100 text-blue-800'
    case 'DEAD': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getStageColor(stage: string): string {
  switch (stage) {
    case 'NEW': return 'bg-blue-100 text-blue-800'
    case 'ENGAGED': return 'bg-yellow-100 text-yellow-800'
    case 'INTERESTED': return 'bg-orange-100 text-orange-800'
    case 'NEGOTIATION': return 'bg-purple-100 text-purple-800'
    case 'CONVERTED': return 'bg-green-100 text-green-800'
    case 'CHURNED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
