'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Users, TrendingUp, Clock, Plus, ArrowRight, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receipts, setReceipts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/auth/login')
        return
      }

      const [{ data: r }, { data: c }] = await Promise.all([
        supabase.from('receipts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user.id),
      ])

      setReceipts(r || [])
      setClients(c || [])
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    )
  }

  const filteredReceipts = receipts.filter(r => {
    const date = new Date(r.created_at)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return month === selectedMonth
  })

  const totalRevenue = filteredReceipts.filter(r => r.status === 'paid').reduce((acc, r) => acc + Number(r.total), 0)
  const pendingCount = filteredReceipts.filter(r => r.status === 'pending').length

  const stats = [
    { label: 'Total no Mês', value: filteredReceipts.length, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', format: 'number' },
    { label: 'Receita no Mês', value: totalRevenue, icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-500/10', format: 'currency' },
    { label: 'Clientes Total', value: clients.length, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', format: 'number' },
    { label: 'Pendentes Mês', value: pendingCount, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', format: 'number' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Resumo financeiro e gestão de recibos.</p>
        </div>
        <div>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-medium">{stat.label}</span>
              <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {stat.format === 'currency' ? formatCurrency(stat.value) : stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-brand-500/20 to-emerald-500/10 border border-brand-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-400 text-sm font-medium mb-1">Receita do Mês Selecionado</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
          </div>
          <TrendingUp className="w-10 h-10 text-brand-500/40" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/receipts/new" className="bg-slate-900 border border-white/5 hover:border-brand-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group">
          <div className="w-12 h-12 bg-brand-500/15 rounded-xl flex items-center justify-center group-hover:bg-brand-500/25 transition-colors">
            <Plus className="w-6 h-6 text-brand-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Novo Recibo</p>
            <p className="text-slate-400 text-xs mt-0.5">Criar recibo profissional</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
        </Link>
        <Link href="/clients/new" className="bg-slate-900 border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group">
          <div className="w-12 h-12 bg-purple-500/15 rounded-xl flex items-center justify-center group-hover:bg-purple-500/25 transition-colors">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Novo Cliente</p>
            <p className="text-slate-400 text-xs mt-0.5">Cadastrar cliente</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
        </Link>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-sm">Recibos do Mês Selecionado</h2>
          <Link href="/receipts" className="text-brand-400 hover:text-brand-300 text-xs transition-colors">Ver todos →</Link>
        </div>
        {filteredReceipts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">Nenhum recibo neste mês</p>
            <Link href="/receipts/new" className="text-brand-400 text-sm hover:text-brand-300">Criar recibo →</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredReceipts.map(receipt => {
              const status = STATUS_LABELS[receipt.status]
              return (
                <Link key={receipt.id} href={`/receipts/${receipt.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium font-mono">{receipt.receipt_number}</p>
                      <p className="text-slate-500 text-xs">{formatDate(receipt.issue_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status?.color === 'green' ? 'bg-brand-500/15 text-brand-400' : status?.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                      {status?.label || 'Desconhecido'}
                    </span>
                    <span className="text-white font-semibold text-sm">{formatCurrency(Number(receipt.total))}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
