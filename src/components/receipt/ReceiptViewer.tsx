'use client'

import { useState } from 'react'
import { Receipt, Profile } from '@/lib/types'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'
import { Download, Printer, CheckCircle, Clock, XCircle, Building2, MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasWhatsAppFeature, hasThemeFeature } from '@/lib/subscription'

interface Props {
  receipt: Receipt & { clients?: any }
  profile: Profile | null
  subscription: any
}

// ─── Themes ───────────────────────────────────────────────
const THEMES = {
  classic:  { label: 'Clássico',  header: 'bg-slate-900',   accent: '#22c55e' },
  ocean:    { label: 'Ocean',     header: 'bg-blue-900',    accent: '#3b82f6' },
  violet:   { label: 'Violeta',   header: 'bg-violet-900',  accent: '#8b5cf6' },
  earth:    { label: 'Terra',     header: 'bg-amber-900',   accent: '#f59e0b' },
  rose:     { label: 'Rosa',      header: 'bg-rose-900',    accent: '#f43f5e' },
  cyan:     { label: 'Ciano',     header: 'bg-cyan-900',    accent: '#06b6d4' },
  indigo:   { label: 'Índigo',    header: 'bg-indigo-900',  accent: '#6366f1' },
  teal:     { label: 'Teal',      header: 'bg-teal-900',    accent: '#14b8a6' },
  orange:   { label: 'Laranja',   header: 'bg-orange-900',  accent: '#f97316' },
  dark:     { label: 'Escuro',    header: 'bg-zinc-950',    accent: '#71717a' },
}

type ThemeKey = keyof typeof THEMES

export default function ReceiptViewer({ receipt, profile, subscription }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [theme, setTheme] = useState<ThemeKey>((profile as any)?.receipt_theme || 'classic')
  const status = STATUS_LABELS[receipt?.status] || { label: 'Desconhecido' }
  const validTheme = THEMES[theme] ? theme : 'classic'
  const t = THEMES[validTheme]
  const itemsListArray = Array.isArray(receipt?.items) ? receipt.items : []

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      const element = document.getElementById('receipt-document')!
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${receipt.receipt_number}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  const handlePrint = () => window.print()

  const handleSendWhatsApp = () => {
    const clientPhone = receipt.clients?.phone
    if (!clientPhone) {
      alert('Este cliente não tem telefone cadastrado nas configurações do cliente.')
      return
    }
    
    const cleanPhone = clientPhone.replace(/\D/g, '')
    const formattedPhone = cleanPhone.length === 11 || cleanPhone.length === 10 ? `55${cleanPhone}` : cleanPhone

    const companyName = profile?.company_name || profile?.full_name || 'Minha Empresa'
    const totalValue = formatCurrency(Number(receipt.total))
    const issueDate = formatDate(receipt.issue_date)
    const itemsList = receipt.items?.map((item: any) => `• ${item.description}: ${item.quantity}x ${formatCurrency(item.unit_price)}`).join('%0A') || ''

    const message = `Olá, *${receipt.clients.name}*! Segue o seu *Recibo nº ${receipt.receipt_number}* emitido por *${companyName}*:%0A%0A💰 *Valor:* ${totalValue}%0A📅 *Data:* ${issueDate}%0A📝 *Itens:*%0A${itemsList}%0A%0AAgradecemos a preferência! 😊`

    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${message}`
    window.open(url, '_blank')
  }

  const saveTheme = async (newTheme: ThemeKey) => {
    setTheme(newTheme)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ receipt_theme: newTheme }).eq('id', user.id)
    }
  }

  const logoUrl = (profile as any)?.company_logo_url
  const hasClientEmail = !!receipt.clients?.email

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center gap-3 justify-between no-print flex-wrap">
        {/* Theme selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Tema:</span>
          {hasThemeFeature(subscription) ? (
            <div className="flex gap-1.5">
              {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => saveTheme(key)}
                  title={t.label}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    theme === key ? 'border-white scale-110' : 'border-transparent opacity-60'
                  }`}
                  style={{ backgroundColor: t.accent }}
                />
              ))}
            </div>
          ) : (
            <a href="/billing" title="Exclusivo do plano Empresarial" className="text-xs bg-brand-500/10 text-brand-400 px-2 py-1 rounded-md border border-brand-500/20 hover:bg-brand-500/20 transition-colors">
              Desbloquear Temas
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Send WhatsApp button */}
          {hasWhatsAppFeature(subscription) ? (
            <button
              onClick={handleSendWhatsApp}
              disabled={!receipt.clients?.phone}
              title={receipt.clients?.phone ? 'Enviar por WhatsApp para o cliente' : 'Cliente sem telefone cadastrado'}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar no WhatsApp
            </button>
          ) : (
            <a
              href="/billing"
              title="Assine um plano para liberar o WhatsApp"
              className="flex items-center gap-2 bg-emerald-600/20 text-emerald-500/50 cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-500/10 hover:bg-emerald-600/30 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Liberar WhatsApp
            </a>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/25"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      {/* Receipt document */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" id="receipt-document">
        {/* Header — themed */}
        <div className={`${t.header} px-10 py-8`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Logo or icon */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-14 h-14 rounded-2xl object-cover bg-white"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.accent }}>
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h2 style={{ fontFamily: 'Arial, Helvetica, sans-serif' }} className="text-white font-bold text-xl">
                  {profile?.company_name || profile?.full_name || 'Minha Empresa'}
                </h2>
                {profile?.company_document && (
                  <p className="text-slate-400 text-sm mt-0.5">CNPJ/CPF: {profile.company_document}</p>
                )}
                {profile?.company_address && (
                  <p className="text-slate-400 text-sm">{profile.company_address}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-1">Recibo</p>
              <p className="text-white font-bold font-mono text-lg">{receipt.receipt_number}</p>
              <p className="text-slate-400 text-sm mt-1">{formatDate(receipt.issue_date)}</p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className={`px-10 py-3 flex items-center gap-2 ${
          receipt.status === 'paid' ? 'bg-emerald-50' :
          receipt.status === 'pending' ? 'bg-amber-50' :
          'bg-red-50'
        }`}>
          {receipt.status === 'paid' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
          {receipt.status === 'pending' && <Clock className="w-4 h-4 text-amber-600" />}
          {receipt.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-600" />}
          <span className={`text-sm font-semibold ${
            receipt.status === 'paid' ? 'text-emerald-700' :
            receipt.status === 'pending' ? 'text-amber-700' :
            'text-red-700'
          }`}>
            {status.label}
            {receipt.payment_method && receipt.status === 'paid' && ` · Pago via ${receipt.payment_method}`}
          </span>
        </div>

        {/* Body */}
        <div className="px-10 py-8">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-2">Emissor</p>
              <p className="text-slate-900 font-semibold">{profile?.company_name || profile?.full_name || 'N/A'}</p>
              {profile?.company_email && <p className="text-slate-500 text-sm">{profile.company_email}</p>}
              {profile?.company_phone && <p className="text-slate-500 text-sm">{profile.company_phone}</p>}
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-2">Recebido de</p>
              {receipt.clients ? (
                <>
                  <p className="text-slate-900 font-semibold">{receipt.clients.name}</p>
                  {receipt.clients.document && <p className="text-slate-500 text-sm">CPF/CNPJ: {receipt.clients.document}</p>}
                  {receipt.clients.email && <p className="text-slate-500 text-sm">{receipt.clients.email}</p>}
                  {receipt.clients.phone && <p className="text-slate-500 text-sm">{receipt.clients.phone}</p>}
                  {receipt.clients.address && <p className="text-slate-500 text-sm">{receipt.clients.address}</p>}
                </>
              ) : (
                <p className="text-slate-400 italic text-sm">Cliente não informado</p>
              )}
            </div>
          </div>

          {receipt.description && (
            <div className="mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-2">Descrição</p>
              <p className="text-slate-700 text-sm">{receipt.description}</p>
            </div>
          )}

          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="text-left text-slate-900 text-xs font-bold uppercase tracking-wider pb-3">Descrição</th>
                  <th className="text-right text-slate-900 text-xs font-bold uppercase tracking-wider pb-3 w-20">Qtd.</th>
                  <th className="text-right text-slate-900 text-xs font-bold uppercase tracking-wider pb-3 w-28">Preço Unit.</th>
                  <th className="text-right text-slate-900 text-xs font-bold uppercase tracking-wider pb-3 w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsListArray.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 text-slate-700 text-sm">{item.description}</td>
                    <td className="py-3 text-right text-slate-600 text-sm">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600 text-sm">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right text-slate-800 font-medium text-sm">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-700">{formatCurrency(Number(receipt.subtotal))}</span>
              </div>
              {Number(receipt.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Desconto</span>
                  <span className="text-red-600">- {formatCurrency(Number(receipt.discount))}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center">
                <span className="text-slate-900 font-bold text-base">TOTAL</span>
                <span style={{ fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: '-0.02em' }} className="text-slate-900 font-bold text-2xl">
                  {formatCurrency(Number(receipt.total))}
                </span>
              </div>
              {receipt.currency !== 'BRL' && (
                <p className="text-slate-400 text-xs text-right">Moeda: {receipt.currency}</p>
              )}
            </div>
          </div>

          {receipt.notes && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Observações</p>
              <p className="text-slate-600 text-sm">{receipt.notes}</p>
            </div>
          )}

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 items-end">
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-xs">Data de emissão</p>
                <p className="text-slate-700 text-sm font-medium">{formatDate(receipt.issue_date)}</p>
              </div>
              {receipt.due_date && (
                <div>
                  <p className="text-slate-400 text-xs">Data de vencimento</p>
                  <p className="text-slate-700 text-sm font-medium">{formatDate(receipt.due_date)}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center md:items-end justify-end h-full">
              {(profile as any)?.company_signature_url ? (
                <div className="flex flex-col items-center">
                  <img
                    src={(profile as any).company_signature_url}
                    alt="Assinatura"
                    className="max-h-16 object-contain mb-1"
                    crossOrigin="anonymous"
                  />
                  <div className="w-48 border-t border-slate-300"></div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mt-1">Assinatura do Emitente</p>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-30">
                  <div className="h-12"></div>
                  <div className="w-48 border-t border-slate-300"></div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mt-1">Assinatura do Emitente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-10 py-4 flex items-center justify-between">
          <p className="text-slate-400 text-xs">
            Recibo gerado em {new Date().toLocaleDateString('pt-BR')} · FinHub
          </p>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-brand-500 rounded flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">R</span>
            </div>
            <span className="text-slate-400 text-xs font-medium">FinHub</span>
          </div>
        </div>
      </div>
    </div>
  )
}
