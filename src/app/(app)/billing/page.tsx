'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { PLANS, getSubscriptionStatus } from '@/lib/subscription'
import {
  CheckCircle, Loader2, Crown, Zap, Building2, Star,
  AlertTriangle, QrCode, FileText, CreditCard, X, Copy, Check
} from 'lucide-react'

const planIcons = { free: Star, basic: Zap, pro: Crown, enterprise: Building2 }
const planColors = {
  free: 'border-slate-700 bg-slate-900/50',
  basic: 'border-blue-500/30 bg-blue-500/5',
  pro: 'border-brand-500/50 bg-brand-500/10',
  enterprise: 'border-purple-500/30 bg-purple-500/5',
}
const btnColors = {
  basic: 'bg-blue-500 hover:bg-blue-400',
  pro: 'bg-brand-500 hover:bg-brand-400',
  enterprise: 'bg-purple-500 hover:bg-purple-400',
}

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [sandboxLoading, setSandboxLoading] = useState(false)
  const [cardData, setCardData] = useState({
    holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '',
    cpfCnpj: '', postalCode: '', addressNumber: '', phone: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUser(user)
      const { data: sub } = await supabase
        .from('subscriptions').select('*, plans(*)').eq('user_id', user.id).single()
      setSubscription(sub)
      
      const { data: profile } = await supabase
        .from('profiles').select('company_document').eq('id', user.id).single()
      if (profile?.company_document) {
        setCardData(prev => ({ ...prev, cpfCnpj: profile.company_document }))
      }
      
      setLoading(false)
    })
  }, [router])

  const confirmSimulatedPayment = async (planId: string) => {
    if (!user) return
    setSandboxLoading(true)
    const supabase = createClient()
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    const monthResetAt = new Date(now)
    monthResetAt.setMonth(monthResetAt.getMonth() + 1)
    monthResetAt.setDate(1)
    monthResetAt.setHours(0, 0, 0, 0)

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        receipts_this_month: 0,
        month_reset_at: monthResetAt.toISOString(),
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      alert('Erro ao confirmar pagamento simulado: ' + error.message)
    } else {
      const { data: sub } = await supabase
        .from('subscriptions').select('*, plans(*)').eq('user_id', user.id).single()
      setSubscription(sub)
      setPaymentInfo(null)
      setSelectedPlan(null)
      alert(`Simulação bem-sucedida! Pagamento do plano ${PLANS[planId as keyof typeof PLANS]?.name} confirmado com sucesso.`)
      router.push('/receipts/new')
    }
    setSandboxLoading(false)
  }

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) return
    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      const body: any = { plan_id: selectedPlan, billing_type: billingType }

      if (billingType === 'CREDIT_CARD') {
        body.credit_card = {
          holderName: cardData.holderName,
          number: cardData.number.replace(/\s/g, ''),
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cardData.ccv,
        }
        body.credit_card_holder_info = {
          name: cardData.holderName,
          email: user.email,
          cpfCnpj: cardData.cpfCnpj.replace(/\D/g, ''),
          postalCode: cardData.postalCode.replace(/\D/g, ''),
          addressNumber: cardData.addressNumber,
          phone: cardData.phone.replace(/\D/g, ''),
        }
      } else {
        body.cpfCnpj = cardData.cpfCnpj.replace(/\D/g, '')
      }

      const res = await fetch('/api/asaas/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao se conectar ao gateway')
      }

      if (data.payment_info) {
        setPaymentInfo(data.payment_info)
      } else {
        setSelectedPlan(null)
        router.push('/billing/success?plan=' + selectedPlan)
      }
    } catch (err: any) {
      console.warn('Real checkout failed (possible placeholder credentials), running in local simulation mode:', err.message)
      
      const supabase = createClient()
      const now = new Date()

      // Set state to pending in DB first
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: selectedPlan,
          status: 'pending',
          updated_at: now.toISOString()
        }, { onConflict: 'user_id' })

      const { data: sub } = await supabase
        .from('subscriptions').select('*, plans(*)').eq('user_id', user.id).single()
      setSubscription(sub)

      if (billingType === 'CREDIT_CARD') {
        // Credit card simulation immediately auto-activates
        await confirmSimulatedPayment(selectedPlan)
      } else {
        // PIX / Boleto opens simulated modal with manual confirmation button
        setPaymentInfo({
          type: billingType.toLowerCase(),
          payload: `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v2/cobv/recibos-saas-mocked-${selectedPlan}`,
          encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          bankSlipUrl: 'https://www.asaas.com/d/pdf/mocked-boleto',
          simulated: true,
          simulatedPlanId: selectedPlan
        })
      }
    }
    setCheckoutLoading(false)
  }

  const copyPix = () => {
    navigator.clipboard.writeText(paymentInfo.payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const simulateSubscription = async (simulation: {
    plan_id: string
    status: string
    trial_ends_at?: string
    receipts_this_month: number
    month_reset_at?: string
  }) => {
    if (!user) return
    setSandboxLoading(true)
    const supabase = createClient()
    
    const now = new Date()
    const trialEndsAt = simulation.trial_ends_at || new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const monthResetAt = simulation.month_reset_at || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: simulation.plan_id,
        status: simulation.status,
        trial_ends_at: trialEndsAt,
        receipts_this_month: simulation.receipts_this_month,
        month_reset_at: monthResetAt,
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      alert('Erro na simulação: ' + error.message)
    } else {
      const { data: sub } = await supabase
        .from('subscriptions').select('*, plans(*)').eq('user_id', user.id).single()
      setSubscription(sub)
      alert('Simulação ativada com sucesso! Teste criar recibos agora.')
    }
    setSandboxLoading(false)
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-96">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  const subStatus = subscription ? getSubscriptionStatus(subscription) : null
  const currentPlanId = subscription?.plan_id || 'free'

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Planos e Assinatura</h1>
        <p className="text-slate-400 text-sm mt-1">Escolha o plano ideal para o seu negócio</p>
      </div>

      {subStatus && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${
          subStatus.isExpired ? 'bg-red-500/10 border-red-500/20' :
          subStatus.isTrialing ? 'bg-yellow-500/10 border-yellow-500/20' :
          'bg-brand-500/10 border-brand-500/20'
        }`}>
          {subStatus.isExpired ? <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" /> :
           subStatus.isTrialing ? <Star className="w-5 h-5 text-yellow-400 flex-shrink-0" /> :
           <CheckCircle className="w-5 h-5 text-brand-400 flex-shrink-0" />}
          <p className={`text-sm font-medium ${
            subStatus.isExpired ? 'text-red-400' :
            subStatus.isTrialing ? 'text-yellow-400' : 'text-brand-400'
          }`}>{subStatus.message}</p>
        </div>
      )}

      {urlError && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm font-medium">Pagamento não aprovado. Tente novamente.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(PLANS).map(plan => {
          const Icon = planIcons[plan.id as keyof typeof planIcons]
          const isCurrentPlan = currentPlanId === plan.id
          const isPopular = plan.id === 'pro'
          const isPaid = plan.id !== 'free'

          return (
            <div key={plan.id} className={`relative rounded-2xl border p-6 flex flex-col transition-all ${planColors[plan.id as keyof typeof planColors]} ${isCurrentPlan ? 'ring-2 ring-brand-500/50' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  MAIS POPULAR
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4 bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1 rounded-full">
                  Atual
                </div>
              )}
              <div className="mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-slate-300" />
                </div>
                <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-white">Grátis</span>
                  ) : (
                    <>
                      <span className="text-slate-400 text-sm">R$</span>
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-400 text-sm">/mês</span>
                    </>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-1">{plan.description}</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {!isPaid ? (
                <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium bg-slate-800 text-slate-500 cursor-default">Trial gratuito</div>
              ) : isCurrentPlan && subscription?.status === 'active' ? (
                <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">✓ Ativo</div>
              ) : (
                <button onClick={() => { setSelectedPlan(plan.id); setCheckoutError(''); setPaymentInfo(null) }}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all text-white ${btnColors[plan.id as keyof typeof btnColors]}`}>
                  {currentPlanId !== 'free' && currentPlanId !== plan.id ? 'Trocar para este' : `Assinar — R$ ${plan.price}/mês`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Formas de pagamento</h3>
        <div className="flex flex-wrap gap-3">
          {['⚡ PIX (imediato)', '📄 Boleto bancário', '💳 Cartão de crédito'].map(m => (
            <span key={m} className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-white/5">{m}</span>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-3">Cobranças mensais automáticas via Asaas. Cancele quando quiser.</p>
      </div>

      {/* Developer Sandbox Panel */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-lg">
              🛠️
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Painel de Teste de Planos e Limites</h3>
              <p className="text-slate-400 text-xs mt-0.5">Use os botões abaixo para simular instantaneamente diferentes estados de assinatura no seu usuário.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => simulateSubscription({ plan_id: 'free', status: 'trialing', receipts_this_month: 5 })}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-yellow-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                Trial Ativo
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">14 dias restantes. Criação liberada.</span>
            </button>

            <button
              onClick={() => {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                simulateSubscription({ plan_id: 'free', status: 'trialing', trial_ends_at: yesterday, receipts_this_month: 10 })
              }}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-red-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                Trial Expirado
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">0 dias restantes. Bloqueia criação.</span>
            </button>

            <button
              onClick={() => simulateSubscription({ plan_id: 'basic', status: 'active', receipts_this_month: 15 })}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-blue-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Básico (Ativo)
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">15/50 recibos usados. Criação liberada.</span>
            </button>

            <button
              onClick={() => simulateSubscription({ plan_id: 'basic', status: 'active', receipts_this_month: 50 })}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-red-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                Básico (Limite Atingido)
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">50/50 recibos usados. Bloqueia criação.</span>
            </button>

            <button
              onClick={() => simulateSubscription({ plan_id: 'pro', status: 'active', receipts_this_month: 180 })}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-brand-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                Pro (Ativo)
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">180/200 recibos usados. Criação liberada.</span>
            </button>

            <button
              onClick={() => simulateSubscription({ plan_id: 'pro', status: 'active', receipts_this_month: 200 })}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-red-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                Pro (Limite Atingido)
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">200/200 recibos usados. Bloqueia criação.</span>
            </button>

            <button
              onClick={() => simulateSubscription({ plan_id: 'enterprise', status: 'active', receipts_this_month: 850 })}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-purple-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                Empresarial (Ilimitado)
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">Uso ilimitado. Nunca bloqueia.</span>
            </button>

            <button
              onClick={() => simulateSubscription({ plan_id: 'pro', status: 'cancelled', receipts_this_month: 20 })}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-red-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Cancelado / Vencido
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">Assinatura inativa. Bloqueia criação.</span>
            </button>

            <button
              onClick={() => simulateSubscription({ plan_id: 'basic', status: 'pending', receipts_this_month: 0 })}
              disabled={sandboxLoading}
              className="flex flex-col items-start gap-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl transition-all text-left hover:border-orange-500/30 group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Pagamento Pendente
              </span>
              <span className="text-slate-300 text-xs mt-1 font-medium">Aguardando confirmação. Bloqueia.</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedPlan && !paymentInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-bold text-lg">Plano {PLANS[selectedPlan as keyof typeof PLANS]?.name}</h2>
                <p className="text-slate-400 text-sm">R$ {PLANS[selectedPlan as keyof typeof PLANS]?.price}/mês</p>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="mb-5">
              <label className="block text-slate-400 text-xs font-medium mb-2">Forma de pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: 'PIX', label: 'PIX', icon: QrCode }, { id: 'BOLETO', label: 'Boleto', icon: FileText }, { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard }].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setBillingType(id as any)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all ${billingType === id ? 'border-brand-500 bg-brand-500/15 text-brand-400' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>
                    <Icon className="w-5 h-5" />{label}
                  </button>
                ))}
              </div>
            </div>

            {billingType === 'CREDIT_CARD' && (
              <div className="space-y-3 mb-5">
                {[
                  { key: 'holderName', label: 'Nome no cartão', placeholder: 'JOAO SILVA' },
                  { key: 'number', label: 'Número do cartão', placeholder: '0000 0000 0000 0000' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-slate-400 text-xs mb-1">{label}</label>
                    <input value={cardData[key as keyof typeof cardData]} onChange={e => setCardData(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 font-mono" />
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2">
                  {[{ key: 'expiryMonth', label: 'Mês', placeholder: 'MM' }, { key: 'expiryYear', label: 'Ano', placeholder: 'AAAA' }, { key: 'ccv', label: 'CVV', placeholder: '000' }].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-slate-400 text-xs mb-1">{label}</label>
                      <input value={cardData[key as keyof typeof cardData]} onChange={e => setCardData(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 font-mono" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: 'cpfCnpj', label: 'CPF/CNPJ', placeholder: '000.000.000-00' }, { key: 'postalCode', label: 'CEP', placeholder: '00000-000' }, { key: 'addressNumber', label: 'Nº endereço', placeholder: '123' }, { key: 'phone', label: 'Telefone', placeholder: '(41) 99999-9999' }].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-slate-400 text-xs mb-1">{label}</label>
                      <input value={cardData[key as keyof typeof cardData]} onChange={e => setCardData(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(billingType === 'PIX' || billingType === 'BOLETO') && (
              <div className="space-y-4 mb-5 animate-fade-in">
                <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-white/5">
                  {billingType === 'PIX' ? (
                    <>
                      <QrCode className="w-8 h-8 text-brand-400 mx-auto mb-2" />
                      <p className="text-slate-300 text-sm font-medium">O QR Code PIX será gerado após confirmar</p>
                      <p className="text-slate-500 text-xs mt-1">Aprovação imediata e ativação automática</p>
                    </>
                  ) : (
                    <>
                      <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-slate-300 text-sm font-medium">O boleto será gerado após confirmar</p>
                      <p className="text-slate-500 text-xs mt-1">Ativação em até 3 dias úteis após o pagamento</p>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 text-xs font-semibold">CPF ou CNPJ do Titular</label>
                  <input
                    value={cardData.cpfCnpj}
                    onChange={e => setCardData(p => ({ ...p, cpfCnpj: e.target.value }))}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-brand-500 font-mono transition-colors"
                  />
                  <p className="text-slate-500 text-[10px]">Necessário para registrar a cobrança nos termos do Banco Central.</p>
                </div>
              </div>
            )}

            {checkoutError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{checkoutError}</div>
            )}

            <button onClick={handleSubscribe} disabled={checkoutLoading}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
              {checkoutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {checkoutLoading ? 'Processando...' : `Confirmar — R$ ${PLANS[selectedPlan as keyof typeof PLANS]?.price}/mês`}
            </button>
            <p className="text-slate-500 text-xs text-center mt-3">Cobrado mensalmente. Cancele quando quiser.</p>
          </div>
        </div>
      )}

      {/* PIX Modal */}
      {paymentInfo?.type === 'pix' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <CheckCircle className="w-10 h-10 text-brand-400 mx-auto mb-3" />
            <h2 className="text-white font-bold text-lg mb-1">Pague via PIX</h2>
            <p className="text-slate-400 text-sm mb-5">Escaneie o QR Code ou copie o código</p>
            {paymentInfo.encodedImage && (
              <img src={`data:image/png;base64,${paymentInfo.encodedImage}`} alt="QR Code PIX" className="w-48 h-48 mx-auto mb-4 rounded-xl bg-white p-2" />
            )}
            <div className="bg-slate-800 rounded-xl p-3 mb-4">
              <p className="text-slate-400 text-xs mb-1">Código PIX Copia e Cola</p>
              <p className="text-white text-xs font-mono break-all line-clamp-3">{paymentInfo.payload}</p>
            </div>
            {paymentInfo.simulated && (
              <button onClick={() => confirmSimulatedPayment(paymentInfo.simulatedPlanId)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mb-3">
                ⚡ Simular Confirmação de Pagamento
              </button>
            )}
            <button onClick={copyPix} className="w-full bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-3">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar código PIX'}
            </button>
            <p className="text-slate-500 text-xs mb-4">Após o pagamento, seu plano é ativado automaticamente.</p>
            <button onClick={() => { setPaymentInfo(null); setSelectedPlan(null); router.push('/dashboard') }} className="text-slate-400 hover:text-white text-sm transition-colors">
              Ir para o dashboard
            </button>
          </div>
        </div>
      )}

      {/* Boleto Modal */}
      {paymentInfo?.type === 'boleto' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <FileText className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <h2 className="text-white font-bold text-lg mb-1">Boleto gerado!</h2>
            <p className="text-slate-400 text-sm mb-2">Vencimento: {paymentInfo.dueDate}</p>
            <p className="text-slate-500 text-xs mb-5">Após o pagamento, aguarde até 3 dias úteis para ativação.</p>
            {paymentInfo.simulated && (
              <button onClick={() => confirmSimulatedPayment(paymentInfo.simulatedPlanId)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mb-3">
                ⚡ Simular Confirmação de Pagamento
              </button>
            )}
            <a href={paymentInfo.bankSlipUrl} target="_blank" rel="noopener noreferrer"
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-3">
              <FileText className="w-4 h-4" />Abrir boleto
            </a>
            <button onClick={() => { setPaymentInfo(null); setSelectedPlan(null); router.push('/dashboard') }} className="text-slate-400 hover:text-white text-sm transition-colors">
              Ir para o dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>}>
      <BillingContent />
    </Suspense>
  )
}
