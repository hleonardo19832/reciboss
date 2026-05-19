'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, FileText, Plus, Pencil, Loader2, X } from 'lucide-react'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [receipts, setReceipts] = useState<any[]>([])

  // Quick Pay Modal states
  const [payReceipt, setPayReceipt] = useState<any | null>(null)
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentValue, setPaymentValue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Pix')
  const [isSubmittingPay, setIsSubmittingPay] = useState(false)

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', params.id).eq('user_id', user.id).single(),
      supabase.from('receipts').select('*').eq('client_id', params.id).eq('user_id', user.id).order('created_at', { ascending: false })
    ])
    if (!c) { router.replace('/clients'); return }
    setClient(c)
    setReceipts(r || [])
  }

  useEffect(() => {
    fetchData().then(() => setLoading(false))
  }, [params.id])

  const handleOpenQuickPay = (receipt: any) => {
    setPayReceipt(receipt)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentValue(receipt.total.toString())
    setPaymentMethod('Pix')
  }

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payReceipt) return
    setIsSubmittingPay(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('receipts')
      .update({
        status: 'paid',
        payment_method: paymentMethod,
        payment_date: paymentDate,
        total: Number(paymentValue.replace(',', '.'))
      })
      .eq('id', payReceipt.id)

    if (error) {
      alert('Erro ao processar pagamento.')
    } else {
      await fetchData()
      setPayReceipt(null)
    }
    setIsSubmittingPay(false)
  }

  if (loading) return <div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  const totalRevenue = receipts.filter(r => r.status === 'paid').reduce((acc, r) => acc + Number(r.total), 0)

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">{client.name}</h1>
        </div>
        <Link href={`/clients/${params.id}/edit`} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
          <Pencil className="w-4 h-4" />Editar
        </Link>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
            <div className="w-14 h-14 bg-brand-500/15 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-brand-400 font-bold text-xl uppercase">{client.name.charAt(0)}</span>
            </div>
            <h2 className="text-white font-semibold text-lg">{client.name}</h2>
            {client.document && <p className="text-slate-400 text-sm mt-1">{client.document}</p>}
            <div className="mt-4 space-y-2">
              {client.email && <div className="flex items-center gap-2 text-slate-400 text-sm"><Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />{client.email}</div>}
              {client.phone && <div className="flex items-center gap-2 text-slate-400 text-sm"><Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />{client.phone}</div>}
              {client.address && <div className="flex items-center gap-2 text-slate-400 text-sm"><MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />{client.address}</div>}
            </div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            <p className="text-slate-500 text-xs mt-1">{receipts.length} recibo(s)</p>
          </div>
          <Link href={`/receipts/new?client=${client.id}`} className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/25">
            <Plus className="w-4 h-4" />Novo Recibo
          </Link>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-white font-semibold text-sm">Histórico de Recibos</h2>
            </div>
            {receipts.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum recibo para este cliente</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {receipts.map(receipt => {
                  const status = STATUS_LABELS[receipt.status]
                  return (
                    <Link key={receipt.id} href={`/receipts/${receipt.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                      <div>
                        <p className="text-white text-sm font-mono font-medium">{receipt.receipt_number}</p>
                        <p className="text-slate-500 text-xs">{formatDate(receipt.issue_date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color === 'green' ? 'bg-brand-500/15 text-brand-400' : status.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>{status.label}</span>
                        {receipt.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleOpenQuickPay(receipt)
                            }}
                            className="bg-brand-500 hover:bg-brand-400 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors border border-brand-600"
                          >
                            Pagar
                          </button>
                        )}
                        <span className="text-white font-semibold text-sm">{formatCurrency(Number(receipt.total))}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Pay Modal */}
      {payReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPayReceipt(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <button
              onClick={() => setPayReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Registrar Pagamento</h3>
            <p className="text-slate-400 text-xs mb-4">
              Confirmando pagamento do recibo <span className="font-mono text-white">{payReceipt.receipt_number}</span>.
            </p>

            <form onSubmit={handleConfirmPay} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Data do Pagamento</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Meio de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Confirmar Valor (R$)</label>
                <input
                  type="text"
                  required
                  value={paymentValue}
                  onChange={e => {
                    const val = e.target.value.replace(/[^\d.,]/g, '')
                    setPaymentValue(val)
                  }}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayReceipt(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium text-sm transition-colors text-center border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmittingPay && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
