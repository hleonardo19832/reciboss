'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Loader2, X } from 'lucide-react'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'

export default function ReceiptsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receipts, setReceipts] = useState<any[]>([])
  
  // Quick Pay Modal states
  const [payReceipt, setPayReceipt] = useState<any | null>(null)
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentValue, setPaymentValue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Pix')
  const [isSubmittingPay, setIsSubmittingPay] = useState(false)

  const fetchReceipts = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('receipts').select('*, clients(name)').eq('user_id', user.id).order('created_at', { ascending: false })
    setReceipts(data || [])
  }

  useEffect(() => {
    fetchReceipts().then(() => setLoading(false))
  }, [])

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
      await fetchReceipts()
      setPayReceipt(null)
    }
    setIsSubmittingPay(false)
  }

  if (loading) return <div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recibos</h1>
          <p className="text-slate-400 text-sm mt-1">{receipts.length} recibo(s) no total</p>
        </div>
        <Link href="/receipts/new" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" />Novo Recibo
        </Link>
      </div>
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        {receipts.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Nenhum recibo ainda</h3>
            <Link href="/receipts/new" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-xl text-sm font-semibold mt-4 transition-all">
              <Plus className="w-4 h-4" />Criar primeiro recibo
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Número</div>
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Data</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <div className="divide-y divide-white/5">
              {receipts.map(receipt => {
                const status = STATUS_LABELS[receipt.status]
                return (
                  <Link key={receipt.id} href={`/receipts/${receipt.id}`} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/2 transition-colors items-center">
                    <div className="col-span-5 md:col-span-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-white text-sm font-mono font-medium truncate">{receipt.receipt_number}</span>
                    </div>
                    <div className="hidden md:block col-span-3 text-slate-300 text-sm truncate">
                      {receipt.clients?.name || <span className="text-slate-600 italic">Sem cliente</span>}
                    </div>
                    <div className="hidden md:block col-span-2 text-slate-400 text-sm">{formatDate(receipt.issue_date)}</div>
                    <div className="col-span-4 md:col-span-2 flex justify-end md:justify-start items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color === 'green' ? 'bg-brand-500/15 text-brand-400' : status.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                        {status.label}
                      </span>
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
                    </div>
                    <div className="col-span-3 md:col-span-2 text-right text-white font-semibold text-sm">{formatCurrency(Number(receipt.total))}</div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
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
