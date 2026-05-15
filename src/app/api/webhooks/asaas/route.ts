import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Asaas webhook:', JSON.stringify(body))

    const { event, payment } = body

    if (!payment?.externalReference) {
      return NextResponse.json({ ok: true })
    }

    const [userId, planId] = payment.externalReference.split('|')
    if (!userId || !planId) return NextResponse.json({ ok: true })

    const now = new Date()

    // Payment confirmed → activate subscription
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      const monthResetAt = new Date(now)
      monthResetAt.setMonth(monthResetAt.getMonth() + 1)
      monthResetAt.setDate(1)
      monthResetAt.setHours(0, 0, 0, 0)

      const { error } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          mp_subscription_id: payment.subscription || payment.id,
          mp_payer_email: payment.customer || null,
          receipts_this_month: 0,
          month_reset_at: monthResetAt.toISOString(),
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('DB error on activate:', error)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }

      console.log(`✅ Subscription ACTIVATED: user=${userId} plan=${planId}`)
    }

    // Payment overdue → expire subscription
    if (event === 'PAYMENT_OVERDUE') {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', userId)

      console.log(`⚠️ Subscription EXPIRED: user=${userId}`)
    }

    // Subscription deleted/cancelled
    if (event === 'PAYMENT_DELETED' || event === 'SUBSCRIPTION_DELETED') {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)

      console.log(`❌ Subscription CANCELLED: user=${userId}`)
    }

    // Renewal confirmed → update period
    if (event === 'PAYMENT_CONFIRMED' && payment.subscription) {
      console.log(`🔄 Subscription RENEWED: user=${userId}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'asaas-webhook' })
}
