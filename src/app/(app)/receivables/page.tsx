'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Loader2, TrendingUp, Clock, AlertCircle, CheckCircle, Filter, Search } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RECEIVABLE_STATUS, Receivable } from '@/lib/types'

export default function ReceivablesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid' | 'partial'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }

      // Auto-update overdue
      await supabase.rpc('update_overdue_receivables')

      const { data } = await supabase
        .from('receivables')
        .select('*, clients(name, email, phone)')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })

      setReceivables(data || [])
      setLoading(false)
    })
  }, [router])

  const filtered = receivables.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter
    const matchSearch = !search || 
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.clients?.name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // Stats
  const total = receivables.reduce((a, r) => a + (r.status !== 'cancelled' ? Number(r.amount) : 0), 0)
  const received = receivables.filter(r => r.status === 'paid').reduce((a, r) => a + Number(r.amount), 0)
  const overdue = receivables.filter(r => r.status === 'overdue').reduce((a, r) => a + Number(r.amount), 0)
  const pending = receivables.filter(r => r.status === 'pending').reduce((a, r) => a + Number(r.amount), 0)

  const now = new Date()
  const dueToday = receivables.filter(r => {
    const d = new Date(r.due_date + 'T00:00:00')
    return r.status === 'pending' && d.toDateString() === now.toDateString()
  }).length

  if (loading) return <div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contas a Receber</h1>
          <p className="text-slate-400 text-sm mt-1">{receivables.length} título(s) · {dueToday > 0 && <span className="text-yellow-400">{dueToday} vencem hoje</span>}</p>
        </div>
        <Link href="/receivables/new" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/25">
          <Plus className="w-4 h-4" />
          Novo Título
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs">Total a Receber</span>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(total)}</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs">Recebido</span>
            <CheckCircle className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-xl font-bold text-brand-400">{formatCurrency(received)}</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs">Pendente</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-xl font-bold text-yellow-400">{formatCurrency(pending)}</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs">Vencido</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(overdue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título ou cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'overdue', 'paid', 'partial'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {f === 'all' ? 'Todos' : RECEIVABLE_STATUS[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">
              {receivables.length === 0 ? 'Nenhum título cadastrado' : 'Nenhum resultado encontrado'}
            </h3>
            {receivables.length === 0 && (
              <Link href="/receivables/new" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold mt-4 transition-all">
                <Plus className="w-4 h-4" />
                Cadastrar primeiro título
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Título / Cliente</div>
              <div className="col-span-2">Vencimento</div>
              <div className="col-span-2">Categoria</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Valor</div>
            </div>

            <div className="divide-y divide-white/5">
              {filtered.map(r => {
                const status = RECEIVABLE_STATUS[r.status]
                const isOverdueDate = r.status === 'overdue'
                const isDueToday = r.status === 'pending' && new Date(r.due_date + 'T00:00:00').toDateString() === now.toDateString()
                const isDueSoon = r.status === 'pending' && !isDueToday && (() => {
                  const diff = (new Date(r.due_date + 'T00:00:00').getTime() - now.getTime()) / (1000*60*60*24)
                  return diff <= 3 && diff > 0
                })()

                return (
                  <Link
                    key={r.id}
                    href={`/receivables/${r.id}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/2 transition-colors items-center group"
                  >
                    <div className="col-span-12 md:col-span-4">
                      <p className="text-white text-sm font-medium">{r.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{r.clients?.name || <span className="italic">Sem cliente</span>}</p>
                    </div>
                    <div className="hidden md:block col-span-2">
                      <p className={`text-sm ${isOverdueDate ? 'text-red-400 font-medium' : isDueToday ? 'text-yellow-400 font-medium' : isDueSoon ? 'text-orange-400' : 'text-slate-400'}`}>
                        {formatDate(r.due_date)}
                      </p>
                      {isDueToday && <p className="text-xs text-yellow-400">Vence hoje</p>}
                      {isDueSoon && <p className="text-xs text-orange-400">Vence em breve</p>}
                      {isOverdueDate && <p className="text-xs text-red-400">Em atraso</p>}
                    </div>
                    <div className="hidden md:block col-span-2">
                      <span className="text-slate-400 text-xs capitalize">{r.category}</span>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="col-span-6 md:col-span-2 text-right">
                      <p className="text-white font-semibold text-sm">{formatCurrency(Number(r.amount))}</p>
                      {r.total_installments > 1 && (
                        <p className="text-slate-500 text-xs">{r.installment_number}/{r.total_installments}x</p>
                      )}
                    </div>
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
