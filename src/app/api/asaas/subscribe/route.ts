import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createSubscription } from '@/lib/asaas'

const PLANS: Record<string, { name: string; value: number }> = {
  basic:      { name: 'Básico',      value: 29.00 },
  pro:        { name: 'Pro',         value: 59.00 },
  enterprise: { name: 'Empresarial', value: 99.00 },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { plan_id, billing_type, credit_card, credit_card_holder_info } = body

    const plan = PLANS[plan_id]
    if (!plan) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', user.id)
      .single()

    const customerName = profile?.company_name || profile?.full_name || user.email?.split('@')[0] || 'Cliente'

    // Create or get Asaas customer
    const customer = await createOrGetCustomer({
      name: customerName,
      email: user.email!,
      externalReference: user.id,
    })

    // Create recurring subscription
    const subscription = await createSubscription({
      customerId: customer.id,
      planId: plan_id,
      planName: plan.name,
      value: plan.value,
      billingType: billing_type || 'PIX',
      externalReference: `${user.id}|${plan_id}`,
      creditCard: credit_card,
      creditCardHolderInfo: credit_card_holder_info,
    })

    // Save subscription ID to DB (will be fully activated by webhook)
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_id,
        status: billing_type === 'CREDIT_CARD' ? 'active' : 'trialing',
        mp_subscription_id: subscription.id,
        mp_payer_email: user.email,
      }, { onConflict: 'user_id' })

    // Get payment info for PIX/Boleto
    let paymentInfo = null
    if (billing_type === 'PIX' || billing_type === 'BOLETO') {
      // Give Asaas a moment to generate the payment
      await new Promise(r => setTimeout(r, 1500))
      const { getSubscriptionPaymentLink } = await import('@/lib/asaas')
      paymentInfo = await getSubscriptionPaymentLink(subscription.id)
    }

    return NextResponse.json({
      subscription_id: subscription.id,
      status: subscription.status,
      payment_info: paymentInfo,
    })
  } catch (error: any) {
    console.error('Asaas checkout error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar assinatura' }, { status: 500 })
  }
}
