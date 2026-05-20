import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createSubscription } from '@/lib/asaas'
import { PLANS } from '@/lib/subscription'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const cookieStore = request.cookies.getAll()
      const cookieNames = cookieStore.map(c => c.name)
      
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing'
      const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing'
      const asaasKey = process.env.ASAAS_API_KEY || 'missing'
      const asaasSandbox = process.env.ASAAS_SANDBOX || 'missing'

      const debugInfo = {
        supabaseUrl: sbUrl !== 'missing' ? `${sbUrl.substring(0, 20)}...` : 'missing',
        supabaseAnonKeyLength: sbAnon !== 'missing' ? sbAnon.length : 0,
        asaasKeyLength: asaasKey !== 'missing' ? asaasKey.length : 0,
        asaasSandbox,
        cookiesFound: cookieNames,
      }

      console.error('Unauthorized request to subscribe API. Debug:', debugInfo)

      return NextResponse.json({ 
        error: 'Não autorizado', 
        debug: debugInfo 
      }, { status: 401 })
    }

    const body = await request.json()
    const { plan_id, billing_type, credit_card, credit_card_holder_info, cpfCnpj } = body

    const plan = PLANS[plan_id as keyof typeof PLANS]
    if (!plan) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    // Get user profile for name and document
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, company_document')
      .eq('id', user.id)
      .single()

    const customerName = profile?.company_name || profile?.full_name || user.email?.split('@')[0] || 'Cliente'
    const finalCpfCnpj = cpfCnpj || credit_card_holder_info?.cpfCnpj || profile?.company_document || ''
    const cleanCpfCnpj = finalCpfCnpj.replace(/\D/g, '')

    if (!cleanCpfCnpj) {
      return NextResponse.json({ error: 'CPF ou CNPJ é obrigatório para faturamento.' }, { status: 400 })
    }

    // Save/update company_document to profile if it changed or was empty
    if (cleanCpfCnpj !== profile?.company_document) {
      await supabase
        .from('profiles')
        .update({ company_document: cleanCpfCnpj })
        .eq('id', user.id)
    }

    // Create or get Asaas customer
    const customer = await createOrGetCustomer({
      name: customerName,
      email: user.email!,
      externalReference: user.id,
      cpfCnpj: cleanCpfCnpj,
    })

    // Create recurring subscription
    const subscription = await createSubscription({
      customerId: customer.id,
      planId: plan_id,
      planName: plan.name,
      value: plan.price,
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
        status: 'pending',
        mp_subscription_id: subscription.id,
        mp_payer_email: user.email,
      }, { onConflict: 'user_id' })

    // Get payment info for PIX/Boleto
    let paymentInfo = null
    if (billing_type === 'PIX' || billing_type === 'BOLETO') {
      const { getSubscriptionPaymentLink } = await import('@/lib/asaas')
      // Retry loop to give Asaas time to generate the payment
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 1000))
        paymentInfo = await getSubscriptionPaymentLink(subscription.id)
        if (paymentInfo) break
      }
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
