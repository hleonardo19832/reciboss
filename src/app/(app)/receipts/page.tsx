'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Loader2, X, Download } from 'lucide-react'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'

export default function ReceiptsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receipts, setReceipts] = useState<any[]>([])
  
  // Filters
  const [filterType, setFilterType] = useState<'month' | 'period'>('month')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
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

  const exportCSV = () => {
    if (filteredReceipts.length === 0) {
      alert('Nenhum recibo para exportar com os filtros atuais.')
      return
    }

    const formatToBRL = (val: number) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val)
    }

    const headers = ['Número do Recibo', 'Cliente', 'Data de Emissão', 'Data de Vencimento', 'Data de Pagamento', 'Método de Pagamento', 'Status', 'Valor Subtotal', 'Desconto', 'Valor Total', 'Moeda', 'Descrição']
    
    const rows = filteredReceipts.map(r => {
      return [
        r.receipt_number,
        `"${r.clients?.name || 'Sem cliente'}"`,
        formatDate(r.issue_date),
        r.due_date ? formatDate(r.due_date) : '',
        r.payment_date ? formatDate(r.payment_date) : '',
        r.payment_method || '',
        STATUS_LABELS[r.status]?.label || 'Desconhecido',
        formatToBRL(r.subtotal),
        formatToBRL(r.discount || 0),
        formatToBRL(r.total),
        r.currency || 'BRL',
        `"${(r.description || '').replace(/"/g, '""')}"`
      ].join(';')
    })
    
    // Adicionamos o BOM (\uFEFF) para o Excel reconhecer os acentos (UTF-8) corretamente
    const csvContent = "\uFEFF" + headers.join(';') + "\n" + rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_recibos_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  const filteredReceipts = receipts.filter(r => {
    const issueDateStr = r.issue_date ? r.issue_date.split('T')[0] : r.created_at.split('T')[0]
    
    if (filterType === 'month') {
      if (!selectedMonth) return true // Se vazio, mostra todos
      // Pega o YYYY-MM da data de emissão
      const month = issueDateStr.substring(0, 7)
      return month === selectedMonth
    } else {
      // Por período
      if (startDate && issueDateStr < startDate) return false
      if (endDate && issueDateStr > endDate) return false
      return true
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recibos</h1>
          <p className="text-slate-400 text-sm mt-1">{filteredReceipts.length} recibo(s) encontrado(s)</p>
        </div>
        
        {/* Filtros e Ações */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setFilterType('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterType === 'month' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Mês
            </button>
            <button 
              onClick={() => setFilterType('period')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterType === 'period' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Período
            </button>
          </div>

          {filterType === 'month' ? (
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-500"
            />
          ) : (
            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-2 py-1.5">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="bg-transparent text-white text-sm focus:outline-none px-2 w-[130px]"
                title="Data inicial"
              />
              <span className="text-slate-500 text-xs">até</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-transparent text-white text-sm focus:outline-none px-2 w-[130px]"
                title="Data final"
              />
            </div>
          )}
          
          {filterType === 'month' && (
            <button
              onClick={() => setSelectedMonth('')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Ver todos
            </button>
          )}

          <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>

          <button 
            onClick={exportCSV}
            title="Exportar para CSV (Excel)"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/5"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <Link href="/receipts/new" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Recibo</span>
          </Link>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        {filteredReceipts.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Nenhum recibo encontrado</h3>
            <p className="text-slate-400 text-sm mb-4">Tente alterar os filtros de data acima.</p>
            <Link href="/receipts/new" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" />Criar novo recibo
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
              {filteredReceipts.map(receipt => {
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
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status?.color === 'green' ? 'bg-brand-500/15 text-brand-400' : status?.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                        {status?.label || 'Desconhecido'}
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
