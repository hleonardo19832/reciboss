'use client'

import { useState } from 'react'
import { Receipt, Profile } from '@/lib/types'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'
import { Download, Printer, CheckCircle, Clock, XCircle, Building2, MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasWhatsAppFeature, hasThemeFeature } from '@/lib/subscription'

interface Props {
  receipt: Receipt & { clients?: any }
  profile: Profile
  subscription: any
}

const THEMES = {
  modern: { bg: 'bg-white', border: 'border-slate-200', accent: '#3b82f6', label: 'Moderno' },
  classic: { bg: 'bg-[#fdfbf7]', border: 'border-[#e5e0d8]', accent: '#1e293b', label: 'Clássico' },
  minimal: { bg: 'bg-white', border: 'border-gray-100', accent: '#000000', label: 'Minimalista' },
} as const

type ThemeKey = keyof typeof THEMES

export default function ReceiptViewer({ receipt, profile, subscription }: Props) {
  const [theme, setTheme] = useState<ThemeKey>((receipt.theme as ThemeKey) || 'modern')
  const [isSaving, setIsSaving] = useState(false)
  const currentTheme = THEMES[theme]

  const saveTheme = async (newTheme: ThemeKey) => {
    setTheme(newTheme)
    setIsSaving(true)
    const supabase = createClient()
    await supabase.from('receipts').update({ theme: newTheme }).eq('id', receipt.id)
    setIsSaving(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    if (!receipt.clients?.phone) return
    const phone = receipt.clients.phone.replace(/\D/g, '')
    const url = `${window.location.origin}/share/${receipt.id}`
    const text = `Olá! Aqui está o seu recibo no valor de ${formatCurrency(receipt.amount)}.\n\nAcesse o link para ver ou baixar o PDF:\n${url}`
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-white/5 print:hidden">
        
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
          {hasWhatsAppFeature(subscription) ? (
            <button
              onClick={handleWhatsApp}
              disabled={!receipt.clients?.phone}
              title={!receipt.clients?.phone ? "Cliente não possui telefone cadastrado" : "Enviar por WhatsApp"}
              className="flex items-center gap-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
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

          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10">
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className={`${currentTheme.bg} rounded-none sm:rounded-2xl border ${currentTheme.border} p-8 sm:p-12 shadow-sm min-h-[800px] print:shadow-none print:border-none print:p-0 transition-colors duration-300`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            {profile.company_logo_url ? (
              <img src={profile.company_logo_url} alt={profile.company_name} className="h-16 object-contain mb-4" />
            ) : (
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900">{profile.company_name}</h1>
            <p className="text-slate-500 mt-1">{profile.company_document}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-light text-slate-900 mb-2">RECIBO</div>
            <div className="text-slate-500 font-mono">#{receipt.id.split('-')[0].toUpperCase()}</div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="flex justify-between items-end border-b border-slate-200 pb-8">
            <div>
              <p className="text-sm text-slate-500 mb-1">Valor do Recibo</p>
              <div className="text-4xl font-bold text-slate-900" style={{ color: currentTheme.accent }}>
                {formatCurrency(receipt.amount)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Data de Emissão</p>
              <p className="text-lg font-medium text-slate-900">{formatDate(receipt.date)}</p>
            </div>
          </div>

          <div className="py-8 text-lg leading-relaxed text-slate-700">
            Recebemos de <strong className="text-slate-900">{receipt.clients?.name}</strong>, 
            portador do documento <strong className="text-slate-900">{receipt.clients?.document}</strong>, 
            a quantia de <strong className="text-slate-900">{formatCurrency(receipt.amount)}</strong>, 
            referente a <strong className="text-slate-900">{receipt.description}</strong>.
          </div>

          {/* Status Badge */}
          <div className="flex justify-center py-8">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold ${
              receipt.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
              receipt.status === 'pending' ? 'bg-amber-50 text-amber-600' :
              'bg-red-50 text-red-600'
            }`}>
              {receipt.status === 'paid' && <CheckCircle className="w-5 h-5" />}
              {receipt.status === 'pending' && <Clock className="w-5 h-5" />}
              {receipt.status === 'cancelled' && <XCircle className="w-5 h-5" />}
              {STATUS_LABELS[receipt.status as keyof typeof STATUS_LABELS]}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-24 flex flex-col items-center text-center">
            {profile.company_signature_url ? (
              <img src={profile.company_signature_url} alt="Assinatura" className="h-20 object-contain mb-4" />
            ) : (
              <div className="w-64 h-px bg-slate-300 mb-4" />
            )}
            <p className="font-semibold text-slate-900">{profile.full_name}</p>
            <p className="text-sm text-slate-500">{profile.company_name}</p>
            {profile.company_address && (
              <p className="text-sm text-slate-400 mt-2">{profile.company_address}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
