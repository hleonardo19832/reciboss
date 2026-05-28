'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import { RECEIVABLE_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { v4 as uuidv4 } from 'uuid'

function NewReceivableForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preClient = searchParams.get('client') || ''

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [installments, setInstallments] = useState(1)
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    client_id: preClient,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    category: 'servico',
    payment_method: '',
    recurrence: 'none',
    notes: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('clients').select('*').eq('user_id', user.id).order('name').then(({ data }) => {
          setClients(data || [])
        })
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const groupId = installments > 1 ? uuidv4() : null
    const baseDate = new Date(form.due_date + 'T00:00:00')

    const records = Array.from({ length: installments }, (_, i) => {
      const dueDate = new Date(baseDate)
      dueDate.setMonth(dueDate.getMonth() + i)
      return {
        user_id: user.id,
        client_id: form.client_id || null,
        title: installments > 1 ? `${form.title} (${i + 1}/${installments})` : form.title,
        description: form.description || null,
        amount: parseFloat(form.amount),
        due_date: dueDate.toISOString().split('T')[0],
        category: form.category,
        payment_method: form.payment_method || null,
        recurrence: form.recurrence,
        installment_number: i + 1,
        total_installments: installments,
        installment_group_id: groupId,
        notes: form.notes || null,
        status: 'pending',
      }
    })

    const { error } = await supabase.from('receivables').insert(records)

    if (!error) {
      router.push('/receivables')
    } else {
      alert('Erro ao salvar. Tente novamente.')
      setLoading(false)
    }
  }

  const ic = "w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
  const lc = "block text-slate-400 text-xs font-medium mb-1.5"

  const totalAmount = parseFloat(form.amount || '0') * installments

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/receivables" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Título a Receber</h1>
          <p className="text-slate-400 text-sm">Cadastre uma conta a receber</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main info */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Informações principais</h2>
          <div className="space-y-4">
            <div>
              <label className={lc}>Título / Descrição *</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Consultoria maio/2026, Aluguel Sala 3..." required className={ic} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={lc}>Cliente</label>
                <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} className={`${ic} cursor-pointer`}>
                  <option value="">Sem cliente (opcional)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Categoria</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={`${ic} cursor-pointer`}>
                  {RECEIVABLE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Valores e vencimento</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Valor (R$) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0,00" min="0.01" step="0.01" required className={ic} />
            </div>
            <div>
              <label className={lc}>Data de vencimento *</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required className={ic} />
            </div>
            <div>
              <label className={lc}>Parcelar em</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setInstallments(Math.max(1, installments - 1))}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl text-white hover:bg-slate-700 transition-colors flex items-center justify-center text-lg font-bold">
                  −
                </button>
                <span className="text-white font-semibold text-lg w-16 text-center">
                  {installments}x
                </span>
                <button type="button" onClick={() => setInstallments(Math.min(24, installments + 1))}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl text-white hover:bg-slate-700 transition-colors flex items-center justify-center text-lg font-bold">
                  +
                </button>
                {installments > 1 && (
                  <span className="text-slate-400 text-sm">
                    = {installments}× de {form.amount ? `R$ ${parseFloat(form.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                  </span>
                )}
              </div>
              {installments > 1 && (
                <p className="text-slate-500 text-xs mt-2">Vencimentos mensais a partir de {form.due_date}</p>
              )}
            </div>
            <div>
              <label className={lc}>Forma de pagamento esperada</label>
              <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} className={`${ic} cursor-pointer`}>
                <option value="">Não especificado</option>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {installments > 1 && form.amount && (
            <div className="mt-4 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-brand-400 text-sm">Total parcelado</span>
              <span className="text-white font-bold text-lg">
                R$ {(parseFloat(form.amount) * installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Observações (opcional)</h2>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3} placeholder="Informações adicionais, número de contrato, referência..." className={`${ic} resize-none`} />
        </div>

        <div className="flex gap-3">
          <Link href="/receivables" className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-medium transition-colors border border-white/10">
            Cancelar
          </Link>
          <button type="submit" disabled={loading}
            className="flex-2 flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Salvando...' : installments > 1 ? `Criar ${installments} parcelas` : 'Salvar título'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewReceivablePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>}>
      <NewReceivableForm />
    </Suspense>
  )
}
