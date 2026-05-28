'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  TrendingUp, Users, Clock, AlertCircle,
  Plus, ArrowRight, Loader2, FileText, CheckCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RECEIVABLE_STATUS } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receivables, setReceivables] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }

      // Auto-update overdue
      await supabase.rpc('update_overdue_receivables')

      const [{ data: rec }, { data: rcp }, { data: cli }] = await Promise.all([
        supabase.from('receivables').select('*, clients(name)').eq('user_id', user.id).order('due_date', { ascending: true }),
        supabase.from('receipts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('clients').select('*').eq('user_id', user.id),
      ])

      setReceivables(rec || [])
      setReceipts(rcp || [])
      setClients(cli || [])
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  // Receivables stats
  const totalReceivable = receivables.filter(r => r.status !== 'cancelled').reduce((a, r) => a + Number(r.amount), 0)
  const totalReceived   = receivables.filter(r => r.status === 'paid').reduce((a, r) => a + Number(r.amount), 0)
  const totalOverdue    = receivables.filter(r => r.status === 'overdue').reduce((a, r) => a + Number(r.amount), 0)
  const totalPending    = receivables.filter(r => r.status === 'pending').reduce((a, r) => a + Number(r.amount), 0)
  const overdueCount    = receivables.filter(r => r.status === 'overdue').length

  const now = new Date()
  const dueToday   = receivables.filter(r => r.status === 'pending' && new Date(r.due_date + 'T00:00:00').toDateString() === now.toDateString())
  const dueSoon    = receivables.filter(r => {
    if (r.status !== 'pending') return false
    const diff = (new Date(r.due_date + 'T00:00:00').getTime() - now.getTime()) / (1000*60*60*24)
    return diff > 0 && diff <= 7
  })
  const overdueList = receivables.filter(r => r.status === 'overdue').slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Visão geral das suas finanças</p>
        </div>
        <Link href="/receivables/new"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/25">
          <Plus className="w-4 h-4" />
          Novo Título
        </Link>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm font-medium">
              {overdueCount} título(s) vencido(s) — total de {formatCurrency(totalOverdue)}
            </p>
          </div>
          <Link href="/receivables?filter=overdue" className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors">
            Ver todos →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs">A Receber</span>
            <div className="w-8 h-8 bg-brand-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(totalReceivable)}</p>
          <p className="text-slate-500 text-xs mt-1">{receivables.filter(r => r.status !== 'cancelled' && r.status !== 'paid').length} títulos</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs">Recebido</span>
            <div className="w-8 h-8 bg-brand-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-brand-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-brand-400">{formatCurrency(totalReceived)}</p>
          <p className="text-slate-500 text-xs mt-1">{receivables.filter(r => r.status === 'paid').length} pagos</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs">Pendente</span>
            <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-yellow-400">{formatCurrency(totalPending)}</p>
          <p className="text-slate-500 text-xs mt-1">{dueToday.length > 0 ? <span className="text-yellow-400">{dueToday.length} vencem hoje</span> : `${receivables.filter(r => r.status === 'pending').length} títulos`}</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs">Vencido</span>
            <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalOverdue)}</p>
          <p className="text-slate-500 text-xs mt-1">{overdueCount} em atraso</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/receivables/new" className="bg-slate-900 border border-white/5 hover:border-brand-500/30 rounded-2xl p-4 flex items-center gap-3 transition-all group">
          <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center group-hover:bg-brand-500/25 transition-colors">
            <TrendingUp className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Novo Título</p>
            <p className="text-slate-500 text-xs">Conta a receber</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 ml-auto transition-colors" />
        </Link>
        <Link href="/receipts/new" className="bg-slate-900 border border-white/5 hover:border-blue-500/30 rounded-2xl p-4 flex items-center gap-3 transition-all group">
          <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center group-hover:bg-blue-500/25 transition-colors">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Novo Recibo</p>
            <p className="text-slate-500 text-xs">PDF profissional</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 ml-auto transition-colors" />
        </Link>
        <Link href="/clients/new" className="bg-slate-900 border border-white/5 hover:border-purple-500/30 rounded-2xl p-4 flex items-center gap-3 transition-all group">
          <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center group-hover:bg-purple-500/25 transition-colors">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Novo Cliente</p>
            <p className="text-slate-500 text-xs">Cadastrar cliente</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 ml-auto transition-colors" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vencimentos próximos */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold text-sm">Vencimentos próximos (7 dias)</h2>
            <Link href="/receivables" className="text-brand-400 hover:text-brand-300 text-xs transition-colors">Ver todos →</Link>
          </div>
          {dueSoon.length === 0 && dueToday.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhum vencimento nos próximos 7 dias</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {[...dueToday, ...dueSoon].slice(0, 5).map(r => (
                <Link key={r.id} href={`/receivables/${r.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-white/2 transition-colors">
                  <div>
                    <p className="text-white text-sm font-medium">{r.title}</p>
                    <p className="text-slate-500 text-xs">{r.clients?.name || 'Sem cliente'} · {formatDate(r.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-semibold">{formatCurrency(Number(r.amount))}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      new Date(r.due_date + 'T00:00:00').toDateString() === now.toDateString()
                        ? 'bg-yellow-500/15 text-yellow-400'
                        : 'bg-slate-500/15 text-slate-400'
                    }`}>
                      {new Date(r.due_date + 'T00:00:00').toDateString() === now.toDateString() ? 'Hoje' : formatDate(r.due_date)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Títulos vencidos */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold text-sm">Títulos vencidos</h2>
            {overdueList.length > 0 && (
              <Link href="/receivables" className="text-red-400 hover:text-red-300 text-xs transition-colors">Ver todos →</Link>
            )}
          </div>
          {overdueList.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhum título vencido</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {overdueList.map(r => {
                const days = Math.floor((now.getTime() - new Date(r.due_date + 'T00:00:00').getTime()) / (1000*60*60*24))
                return (
                  <Link key={r.id} href={`/receivables/${r.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-white/2 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{r.title}</p>
                      <p className="text-slate-500 text-xs">{r.clients?.name || 'Sem cliente'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 text-sm font-semibold">{formatCurrency(Number(r.amount))}</p>
                      <p className="text-red-400/70 text-xs">{days} dia(s) atraso</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent receipts */}
      {receipts.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold text-sm">Recibos recentes</h2>
            <Link href="/receipts" className="text-brand-400 hover:text-brand-300 text-xs transition-colors">Ver todos →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {receipts.map(receipt => {
              const status = STATUS_LABELS[receipt.status]
              return (
                <Link key={receipt.id} href={`/receipts/${receipt.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-mono font-medium">{receipt.receipt_number}</p>
                      <p className="text-slate-500 text-xs">{formatDate(receipt.issue_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      status.color === 'green' ? 'bg-brand-500/15 text-brand-400' :
                      status.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>{status.label}</span>
                    <span className="text-white font-semibold text-sm">{formatCurrency(Number(receipt.total))}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
