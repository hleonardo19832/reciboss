'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'

export default function ReceiptsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receipts, setReceipts] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      const { data } = await supabase.from('receipts').select('*, clients(name)').eq('user_id', user.id).order('created_at', { ascending: false })
      setReceipts(data || [])
      setLoading(false)
    })
  }, [router])

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
                    <div className="col-span-4 md:col-span-2 flex justify-end md:justify-start">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color === 'green' ? 'bg-brand-500/15 text-brand-400' : status.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="col-span-3 md:col-span-2 text-right text-white font-semibold text-sm">{formatCurrency(Number(receipt.total))}</div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
