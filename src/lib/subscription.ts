export interface Plan {
  id: string
  name: string
  price: number
  receipts_limit: number | null
  description: string
  is_active: boolean
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'trialing' | 'active' | 'expired' | 'cancelled' | 'pending'
  trial_ends_at: string
  current_period_start: string | null
  current_period_end: string | null
  mp_subscription_id: string | null
  mp_payer_email: string | null
  receipts_this_month: number
  month_reset_at: string
  created_at: string
  plans?: Plan
}

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    receipts_limit: null,
    description: 'Trial de 14 dias',
    features: ['Acesso completo por 14 dias', 'Recibos ilimitados', 'Clientes ilimitados', 'Download em PDF'],
    color: 'slate',
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    price: 29,
    receipts_limit: 50,
    description: '50 recibos por mês',
    features: ['50 recibos por mês', 'Clientes ilimitados', 'Download em PDF', 'Suporte por email'],
    color: 'blue',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 59,
    receipts_limit: 200,
    description: '200 recibos por mês',
    features: ['200 recibos por mês', 'Clientes ilimitados', 'Download em PDF', 'Logo personalizada no recibo', 'Suporte prioritário'],
    color: 'brand',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Empresarial',
    price: 99,
    receipts_limit: null,
    description: 'Recibos ilimitados',
    features: ['Recibos ilimitados', 'Clientes ilimitados', 'Download em PDF', 'Logo personalizada no recibo', 'Múltiplos usuários', 'Temas de recibo', 'Envio por email', 'Suporte dedicado'],
    color: 'purple',
  },
}

export function getSubscriptionStatus(sub: Subscription): {
  canCreate: boolean
  isTrialing: boolean
  isExpired: boolean
  daysLeft: number | null
  message: string
} {
  const now = new Date()

  if (sub.status === 'trialing') {
    const trialEnd = new Date(sub.trial_ends_at)
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 0) {
      return { canCreate: false, isTrialing: true, isExpired: true, daysLeft: 0, message: 'Seu trial expirou. Escolha um plano para continuar.' }
    }
    return { canCreate: true, isTrialing: true, isExpired: false, daysLeft, message: `Trial: ${daysLeft} dia(s) restante(s)` }
  }

  if (sub.status === 'active') {
    const plan = PLANS[sub.plan_id as keyof typeof PLANS]
    if (plan?.receipts_limit !== null) {
      const resetAt = new Date(sub.month_reset_at)
      if (now >= resetAt) {
        return { canCreate: true, isTrialing: false, isExpired: false, daysLeft: null, message: `Plano ${plan.name} ativo` }
      }
      const remaining = (plan.receipts_limit || 0) - sub.receipts_this_month
      if (remaining <= 0) {
        return { canCreate: false, isTrialing: false, isExpired: false, daysLeft: null, message: 'Limite de recibos atingido. Aguarde o próximo mês ou faça upgrade.' }
      }
      return { canCreate: true, isTrialing: false, isExpired: false, daysLeft: null, message: `${remaining} recibo(s) restantes este mês` }
    }
    return { canCreate: true, isTrialing: false, isExpired: false, daysLeft: null, message: `Plano ${plan?.name} ativo` }
  }

  if (sub.status === 'pending') {
    return { canCreate: false, isTrialing: false, isExpired: false, daysLeft: null, message: 'Aguardando confirmação de pagamento.' }
  }

  if (sub.status === 'expired' || sub.status === 'cancelled') {
    return { canCreate: false, isTrialing: false, isExpired: true, daysLeft: null, message: 'Assinatura encerrada. Escolha um plano para continuar.' }
  }

  return { canCreate: false, isTrialing: false, isExpired: true, daysLeft: null, message: 'Sem plano ativo.' }
}
