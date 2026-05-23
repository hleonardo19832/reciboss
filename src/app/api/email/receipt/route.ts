import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { formatCurrency, formatDate } from '@/lib/utils'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { receipt_id } = await request.json()

    // Check if user has Resend configured
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ error: 'Serviço de email não configurado. Adicione RESEND_API_KEY nas variáveis de ambiente.' }, { status: 400 })
    }

    // Fetch receipt with client
    const { data: receipt } = await supabaseAdmin
      .from('receipts')
      .select('*, clients(*)')
      .eq('id', receipt_id)
      .eq('user_id', user.id)
      .single()

    if (!receipt) {
      return NextResponse.json({ error: 'Recibo não encontrado' }, { status: 404 })
    }

    if (!receipt.clients?.email) {
      return NextResponse.json({ error: 'Cliente sem email cadastrado' }, { status: 400 })
    }

    // Fetch sender profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const senderName = profile?.company_name || profile?.full_name || 'FinHub'
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'noreply@finhub.com.br'

    // Build email HTML
    const statusColor = receipt.status === 'paid' ? '#16a34a' : receipt.status === 'pending' ? '#d97706' : '#dc2626'
    const statusLabel = receipt.status === 'paid' ? 'Pago' : receipt.status === 'pending' ? 'Pendente' : 'Cancelado'

    const itemsHtml = receipt.items?.map((item: any) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155;">${item.description}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 14px; color: #64748b;">${item.quantity}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 14px; color: #64748b;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 14px; font-weight: 500; color: #1e293b;">${formatCurrency(item.total)}</td>
      </tr>
    `).join('') || ''

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background: #0f172a; padding: 32px 40px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 700;">${senderName}</h1>
          ${profile?.company_document ? `<p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">CNPJ/CPF: ${profile.company_document}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Recibo</p>
          <p style="margin: 4px 0 0; color: white; font-size: 16px; font-weight: 700; font-family: monospace;">${receipt.receipt_number}</p>
          <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">${formatDate(receipt.issue_date)}</p>
        </div>
      </div>
    </div>

    <!-- Status -->
    <div style="padding: 12px 40px; background: ${receipt.status === 'paid' ? '#f0fdf4' : receipt.status === 'pending' ? '#fffbeb' : '#fef2f2'};">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${statusColor};">● ${statusLabel}${receipt.payment_method && receipt.status === 'paid' ? ` · Pago via ${receipt.payment_method}` : ''}</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 40px;">
      <!-- Parties -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <div>
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600;">Emissor</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${senderName}</p>
          ${profile?.company_email ? `<p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">${profile.company_email}</p>` : ''}
        </div>
        <div>
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600;">Recebido de</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${receipt.clients.name}</p>
          ${receipt.clients.email ? `<p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">${receipt.clients.email}</p>` : ''}
        </div>
      </div>

      <!-- Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 2px solid #0f172a;">
            <th style="text-align: left; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Descrição</th>
            <th style="text-align: right; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Qtd.</th>
            <th style="text-align: right; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Preço</th>
            <th style="text-align: right; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- Total -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
        <div style="width: 220px;">
          ${Number(receipt.discount) > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; color: #64748b;">Desconto</span>
            <span style="font-size: 14px; color: #dc2626;">- ${formatCurrency(Number(receipt.discount))}</span>
          </div>` : ''}
          <div style="border-top: 2px solid #0f172a; padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; font-weight: 700; color: #0f172a;">TOTAL</span>
            <span style="font-size: 24px; font-weight: 700; color: #0f172a;">${formatCurrency(Number(receipt.total))}</span>
          </div>
        </div>
      </div>

      ${receipt.notes ? `
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600;">Observações</p>
        <p style="margin: 0; font-size: 13px; color: #475569;">${receipt.notes}</p>
      </div>` : ''}
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 40px; display: flex; justify-content: space-between; align-items: center;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">Gerado em ${new Date().toLocaleDateString('pt-BR')} · FinHub</p>
    </div>
  </div>
</body>
</html>`

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [receipt.clients.email],
        subject: `Recibo ${receipt.receipt_number} - ${senderName}`,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.json()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
