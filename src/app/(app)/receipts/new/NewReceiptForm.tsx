'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import { generateReceiptNumber, PAYMENT_METHODS, formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSubscriptionStatus } from '@/lib/subscription'
import { v4 as uuidv4 } from 'uuid'

interface Item {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export default function NewReceiptForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClient = searchParams.get('client') || ''

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [canCreate, setCanCreate] = useState(true)
  const [blockMessage, setBlockMessage] = useState('')
  const [form, setForm] = useState({
    receipt_number: generateReceiptNumber(),
    client_id: preselectedClient,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    payment_method: 'PIX',
    status: 'paid',
    notes: '',
    discount: 0,
    currency: 'BRL',
  })

  const [items, setItems] = useState<Item[]>([
    { id: uuidv4(), description: '', quantity: 1, unit_price: 0, total: 0 }
  ])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('clients').select('*').eq('user_id', user.id).order('name').then(({ data }) => {
          setClients(data || [])
        })
        // Check subscription
        supabase.from('subscriptions').select('*, plans(*)').eq('user_id', user.id).single().then(({ data: sub }) => {
          if (sub) {
            const status = getSubscriptionStatus(sub as any)
            setCanCreate(status.canCreate)
            if (!status.canCreate) setBlockMessage(status.message)
          }
        })
      }
    })
  }, [])

  const updateItem = (id: string, field: keyof Item, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = Number(updated.quantity) * Number(updated.unit_price)
      }
      return updated
    }))
  }

  const addItem = () => setItems(prev => [...prev, { id: uuidv4(), description: '', quantity: 1, unit_price: 0, total: 0 }])
  const removeItem = (id: string) => { if (items.length > 1) setItems(prev => prev.filter(i => i.id !== id)) }

  const subtotal = items.reduce((acc, i) => acc + i.total, 0)
  const total = subtotal - Number(form.discount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('receipts').insert({
      user_id: user.id,
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
    })

    if (!error) {
      router.push('/receipts')
    } else {
      alert('Erro ao salvar recibo. Tente novamente.')
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
  const labelClass = "block text-slate-400 text-xs font-medium mb-1.5"

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/receipts" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Recibo</h1>
          <p className="text-slate-400 text-sm">Preencha os dados para gerar o recibo</p>
        </div>
      </div>

      {!canCreate && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <div className="text-red-400 font-semibold mb-2">⚠️ {blockMessage}</div>
          <Link href="/billing" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all mt-3">
            Ver planos disponíveis
          </Link>
        </div>
      )}
      <form onSubmit={handleSubmit} className={`space-y-6 ${!canCreate ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
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
                    <option value="">Selecionar cliente (opcional)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-xs mt-1 text-slate-500">
                      <Link href="/clients/new" className="text-brand-400 hover:text-brand-300">+ Cadastrar primeiro cliente</Link>
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Data de Emissão</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Data de Vencimento (opcional)</label>
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
                <label className={labelClass}>Descrição geral (opcional)</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Serviços de consultoria - Junho/2024" className={inputClass} />
              </div>
            </div>

            {/* Items */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Itens / Serviços</h2>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
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
                      <div className="bg-slate-800 border border-white/5 rounded-xl px-3 py-2.5 text-slate-300 text-sm font-medium text-right">{formatCurrency(item.total)}</div>
                    </div>
                    <div className="col-span-1 pb-0.5 flex justify-center">
                      <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="text-slate-600 hover:text-red-400 disabled:opacity-30 transition-colors p-1.5">
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

            {/* Notes */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Observações (opcional)</h2>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Informações adicionais, instruções de pagamento, etc." className={`${inputClass} resize-none`} />
            </div>
          </div>

          {/* Sidebar totals */}
          <div>
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 sticky top-24">
              <h2 className="text-white font-semibold mb-4">Resumo</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Desconto (R$)</span>
                  <input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} min="0" step="0.01"
                    className="w-28 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-brand-400 font-bold text-xl">{formatCurrency(total)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full mt-6 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Salvando...' : 'Salvar Recibo'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
