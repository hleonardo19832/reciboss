'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, CheckCircle, Loader2, AlertTriangle, FileText, Clock, TrendingUp, X } from 'lucide-react'
import { formatCurrency, formatDate, PAYMENT_METHODS } from '@/lib/utils'
import { RECEIVABLE_STATUS, Receivable } from '@/lib/types'

export default function ReceivableDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receivable, setReceivable] = useState<Receivable | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [payForm, setPayForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'PIX',
    amount_paid: '',
    partial: false,
  })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    const { data } = await supabase
      .from('receivables')
      .select('*, clients(name, email, phone)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!data) { router.replace('/receivables'); return }
    setReceivable(data)
    setPayForm(p => ({ ...p, amount_paid: String(data.amount) }))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [params.id])

  const handleMarkPaid = async () => {
    if (!receivable) return
    setSaving(true)
    const supabase = createClient()
    const amountPaid = parseFloat(payForm.amount_paid)
    const isPartial = payForm.partial && amountPaid < Number(receivable.amount)

    await supabase.from('receivables').update({
      status: isPartial ? 'partial' : 'paid',
      payment_date: payForm.payment_date,
      payment_method: payForm.payment_method,
      amount_paid: amountPaid,
    }).eq('id', receivable.id)

    setShowPayModal(false)
    setSaving(false)
    fetchData()
  }

  const handleCancel = async () => {
    if (!receivable) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('receivables').update({ status: 'cancelled' }).eq('id', receivable.id)
    setShowCancelModal(false)
    setSaving(false)
    fetchData()
  }

  if (loading) return <div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
  if (!receivable) return null

  const status = RECEIVABLE_STATUS[receivable.status]
  const isPaid = receivable.status === 'paid'
  const isCancelled = receivable.status === 'cancelled'
  const canPay = !isPaid && !isCancelled
  const overdueDays = receivable.status === 'overdue'
    ? Math.floor((Date.now() - new Date(receivable.due_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const ic = "w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/receivables" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{receivable.title}</h1>
            <p className="text-slate-400 text-sm">{receivable.clients?.name || 'Sem cliente'}</p>
          </div>
        </div>
        <Link href={`/receivables/${params.id}/edit`}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
          <Pencil className="w-4 h-4" />Editar
        </Link>
      </div>

      {/* Overdue alert */}
      {receivable.status === 'overdue' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mb-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm font-medium">
            Este título está vencido há <strong>{overdueDays} dia(s)</strong>. Registre o recebimento ou cancele.
          </p>
        </div>
      )}

      {/* Main card */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mb-5">
        {/* Status bar */}
        <div className={`px-6 py-3 flex items-center justify-between ${status.bg}`}>
          <span className={`text-sm font-semibold ${status.text}`}>{status.label}</span>
          {receivable.total_installments > 1 && (
            <span className="text-slate-400 text-xs">Parcela {receivable.installment_number}/{receivable.total_installments}</span>
          )}
        </div>

        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Valor</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(Number(receivable.amount))}</p>
              {receivable.status === 'partial' && receivable.amount_paid > 0 && (
                <p className="text-brand-400 text-sm mt-1">Recebido: {formatCurrency(Number(receivable.amount_paid))}</p>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Vencimento</p>
                <p className={`text-sm font-medium ${receivable.status === 'overdue' ? 'text-red-400' : 'text-white'}`}>
                  {formatDate(receivable.due_date)}
                </p>
              </div>
              {receivable.payment_date && (
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Data de recebimento</p>
                  <p className="text-sm font-medium text-brand-400">{formatDate(receivable.payment_date)}</p>
                </div>
              )}
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Categoria</p>
                <p className="text-sm text-white capitalize">{receivable.category}</p>
              </div>
              {receivable.payment_method && (
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Forma de pagamento</p>
                  <p className="text-sm text-white">{receivable.payment_method}</p>
                </div>
              )}
            </div>
          </div>

          {receivable.clients && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Cliente</p>
              <p className="text-white font-medium">{receivable.clients.name}</p>
              {receivable.clients.email && <p className="text-slate-400 text-sm">{receivable.clients.email}</p>}
              {receivable.clients.phone && <p className="text-slate-400 text-sm">{receivable.clients.phone}</p>}
            </div>
          )}

          {receivable.notes && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Observações</p>
              <p className="text-slate-300 text-sm">{receivable.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {canPay && (
        <div className="flex gap-3">
          <button onClick={() => setShowPayModal(true)}
            className="flex-1 bg-brand-500 hover:bg-brand-400 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/25">
            <CheckCircle className="w-4 h-4" />
            Registrar Recebimento
          </button>
          <button onClick={() => setShowCancelModal(true)}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-xl text-sm font-medium transition-all border border-white/10">
            Cancelar
          </button>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Registrar Recebimento</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Data de recebimento</label>
                <input type="date" value={payForm.payment_date} onChange={e => setPayForm(p => ({ ...p, payment_date: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Forma de pagamento</label>
                <select value={payForm.payment_method} onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))} className={`${ic} cursor-pointer`}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400 text-xs">Valor recebido</label>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={payForm.partial} onChange={e => setPayForm(p => ({ ...p, partial: e.target.checked }))} className="rounded" />
                    Recebimento parcial
                  </label>
                </div>
                <input type="number" value={payForm.amount_paid} onChange={e => setPayForm(p => ({ ...p, amount_paid: e.target.value }))}
                  min="0.01" step="0.01" className={ic} />
                {payForm.partial && parseFloat(payForm.amount_paid) < Number(receivable.amount) && (
                  <p className="text-yellow-400 text-xs mt-1">
                    Faltam {formatCurrency(Number(receivable.amount) - parseFloat(payForm.amount_paid))}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPayModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-sm transition-colors">Cancelar</button>
              <button onClick={handleMarkPaid} disabled={saving}
                className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Cancelar título?</h3>
                <p className="text-slate-400 text-sm">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-sm">Voltar</button>
              <button onClick={handleCancel} disabled={saving}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Cancelar título
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
