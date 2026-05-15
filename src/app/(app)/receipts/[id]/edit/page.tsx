'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client, Receipt, ReceiptItem } from '@/lib/types'
import { PAYMENT_METHODS, formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'

export default function EditReceiptPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

  const [form, setForm] = useState({
    receipt_number: '',
    client_id: '',
    issue_date: '',
    due_date: '',
    description: '',
    payment_method: 'PIX',
    status: 'paid',
    notes: '',
    discount: 0,
    currency: 'BRL',
  })

  const [items, setItems] = useState<ReceiptItem[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const [{ data: receipt }, { data: clientList }] = await Promise.all([
        supabase.from('receipts').select('*').eq('id', params.id).eq('user_id', user.id).single(),
        supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
      ])

      if (!receipt) {
        router.push('/receipts')
        return
      }

      setForm({
        receipt_number: receipt.receipt_number,
        client_id: receipt.client_id || '',
        issue_date: receipt.issue_date,
        due_date: receipt.due_date || '',
        description: receipt.description || '',
        payment_method: receipt.payment_method || 'PIX',
        status: receipt.status,
        notes: receipt.notes || '',
        discount: Number(receipt.discount) || 0,
        currency: receipt.currency || 'BRL',
      })

      setItems(receipt.items?.length > 0 ? receipt.items : [
        { id: uuidv4(), description: '', quantity: 1, unit_price: 0, total: 0 }
      ])
      setClients(clientList || [])
      setPageLoading(false)
    })
  }, [params.id, router])

  const updateItem = (id: string, field: keyof ReceiptItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = Number(updated.quantity) * Number(updated.unit_price)
      }
      return updated
    }))
  }

  const addItem = () => {
    setItems(prev => [...prev, { id: uuidv4(), description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(prev => prev.filter(i => i.id !== id))
  }

  const subtotal = items.reduce((acc, i) => acc + i.total, 0)
  const total = subtotal - Number(form.discount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from('receipts').update({
      client_id: form.client_id || null,
      receipt_number: form.receipt_number,
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      description: form.description,
      items,
      subtotal,
      discount: Number(form.discount),
      total,
      currency: form.currency,
      payment_method: form.payment_method,
      status: form.status,
      notes: form.notes,
    }).eq('id', params.id)

    if (!error) {
      router.push(`/receipts/${params.id}`)
    } else {
      alert('Erro ao atualizar recibo.')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('receipts').delete().eq('id', params.id)
    if (!error) {
      router.push('/receipts')
    } else {
      alert('Erro ao excluir recibo.')
      setDeleting(false)
    }
  }

  const inputClass = "w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
  const labelClass = "block text-slate-400 text-xs font-medium mb-1.5"

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/receipts/${params.id}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Recibo</h1>
            <p className="text-slate-400 text-sm font-mono">{form.receipt_number}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm transition-all border border-red-500/20 hover:border-red-500/40"
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Excluir recibo?</h3>
                <p className="text-slate-400 text-sm">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Informações do Recibo</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Número do Recibo</label>
                  <input type="text" value={form.receipt_number} onChange={e => setForm(p => ({ ...p, receipt_number: e.target.value }))} required className={`${inputClass} font-mono`} />
                </div>
                <div>
                  <label className={labelClass}>Cliente</label>
                  <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} className={`${inputClass} cursor-pointer`}>
                    <option value="">Sem cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Data de Emissão</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Data de Vencimento</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Forma de Pagamento</label>
                  <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} className={`${inputClass} cursor-pointer`}>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={`${inputClass} cursor-pointer`}>
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass}>Descrição geral</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Serviços de consultoria" className={inputClass} />
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Itens / Serviços</h2>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      {i === 0 && <label className={labelClass}>Descrição</label>}
                      <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Serviço ou produto" required className={inputClass} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className={labelClass}>Qtd.</label>}
                      <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} min="0.01" step="0.01" required className={inputClass} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className={labelClass}>Preço unit.</label>}
                      <input type="number" value={item.unit_price} onChange={e => updateItem(item.id, 'unit_price', Number(e.target.value))} min="0" step="0.01" required className={inputClass} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className={labelClass}>Total</label>}
                      <div className="bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-medium">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {i === 0 && <div className="h-[18px]" />}
                      <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="text-slate-600 hover:text-red-400 disabled:opacity-30 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} className="mt-4 flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm transition-colors">
                <Plus className="w-4 h-4" />
                Adicionar item
              </button>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Observações</h2>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Informações adicionais..." className={`${inputClass} resize-none`} />
            </div>
          </div>

          <div>
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 sticky top-24">
              <h2 className="text-white font-semibold mb-4">Resumo</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Desconto</span>
                  <input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} min="0" step="0.01"
                    className="w-28 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-brand-400 font-bold text-xl">{formatCurrency(total)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full mt-6 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
