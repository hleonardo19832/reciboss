import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T00:00:00'))
}

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 90000) + 10000
  return `REC-${year}-${random}`
}

export const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência Bancária',
  'Boleto',
  'Cheque',
]

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: 'Pago', color: 'green' },
  pending: { label: 'Pendente', color: 'yellow' },
  cancelled: { label: 'Cancelado', color: 'red' },
}
