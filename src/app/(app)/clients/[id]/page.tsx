'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, FileText, Plus, Pencil, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [receipts, setReceipts] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', params.id).eq('user_id', user.id).single(),
        supabase.from('receipts').select('*').eq('client_id', params.id).eq('user_id', user.id).order('created_at', { ascending: false })
      ])
      if (!c) { router.replace('/clients'); return }
      setClient(c)
      setReceipts(r || [])
      setLoading(false)
    })
  }, [params.id, router])

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
    </div>
  )
}
