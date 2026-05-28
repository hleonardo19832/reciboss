'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import { RECEIVABLE_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function EditReceivablePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    title: '', description: '', amount: '', client_id: '',
    due_date: '', category: 'servico', payment_method: '', notes: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const [{ data: rec }, { data: cls }] = await Promise.all([
        supabase.from('receivables').select('*').eq('id', params.id).eq('user_id', user.id).single(),
        supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
      ])
      if (!rec) { router.push('/receivables'); return }
      setForm({
        title: rec.title || '',
        description: rec.description || '',
        amount: String(rec.amount),
        client_id: rec.client_id || '',
        due_date: rec.due_date,
        category: rec.category,
        payment_method: rec.payment_method || '',
        notes: rec.notes || '',
      })
      setClients(cls || [])
      setPageLoading(false)
    })
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('receivables').update({
      title: form.title,
      description: form.description || null,
      amount: parseFloat(form.amount),
      client_id: form.client_id || null,
      due_date: form.due_date,
      category: form.category,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
    }).eq('id', params.id)

    if (!error) router.push(`/receivables/${params.id}`)
    else { alert('Erro ao salvar.'); setLoading(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('receivables').delete().eq('id', params.id)
    router.push('/receivables')
  }

  const ic = "w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
  const lc = "block text-slate-400 text-xs font-medium mb-1.5"

  if (pageLoading) return <div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/receivables/${params.id}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Editar Título</h1>
        </div>
        <button onClick={() => setShowDelete(true)}
          className="text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm transition-all border border-red-500/20">
          Excluir
        </button>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Excluir título?</h3>
                <p className="text-slate-400 text-sm">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDelete(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-sm">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <div>
            <label className={lc}>Título *</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className={ic} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Cliente</label>
              <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} className={`${ic} cursor-pointer`}>
                <option value="">Sem cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Categoria</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={`${ic} cursor-pointer`}>
                {RECEIVABLE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Valor (R$) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} min="0.01" step="0.01" required className={ic} />
            </div>
            <div>
              <label className={lc}>Data de vencimento *</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required className={ic} />
            </div>
            <div>
              <label className={lc}>Forma de pagamento</label>
              <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} className={`${ic} cursor-pointer`}>
                <option value="">Não especificado</option>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lc}>Observações</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className={`${ic} resize-none`} />
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/receivables/${params.id}`} className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-medium transition-colors border border-white/10">
            Cancelar
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
