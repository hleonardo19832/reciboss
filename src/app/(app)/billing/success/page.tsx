'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PLANS } from '@/lib/subscription'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'basic'
  const [loading, setLoading] = useState(true)
  const [activated, setActivated] = useState(false)

  const plan = PLANS[planId as keyof typeof PLANS]

  useEffect(() => {
    // Poll for subscription activation (webhook may take a few seconds)
    let attempts = 0
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (sub?.status === 'active' && sub?.plan_id === planId) {
        setActivated(true)
        setLoading(false)
        return
      }

      attempts++
      if (attempts < 10) {
        setTimeout(check, 2000)
      } else {
        // Manually activate as fallback
        const paymentId = searchParams.get('payment_id')
        if (paymentId) {
          const now = new Date()
          const periodEnd = new Date(now)
          periodEnd.setMonth(periodEnd.getMonth() + 1)

          await supabase.from('subscriptions').upsert({
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            mp_subscription_id: paymentId,
            receipts_this_month: 0,
          }, { onConflict: 'user_id' })

          setActivated(true)
        }
        setLoading(false)
      }
    }

    check()
  }, [planId, searchParams])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {loading ? (
          <>
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Ativando seu plano...</h1>
            <p className="text-slate-400">Confirmando seu pagamento</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-brand-400" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-3">
              {activated ? 'Plano ativado!' : 'Pagamento recebido!'}
            </h1>
            <p className="text-slate-400 mb-2">
              Bem-vindo ao plano <span className="text-brand-400 font-semibold">{plan?.name}</span>
            </p>
            <p className="text-slate-500 text-sm mb-8">
              {plan?.description}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/25"
            >
              Ir para o Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
