'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Plus, Phone, Mail, FileText, Loader2 } from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name')
      setClients(data || [])
      setLoading(false)
    })
  }, [router])

  if (loading) return <div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <Link href="/clients/new" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" />Novo Cliente
        </Link>
      </div>
      {clients.length === 0 ? (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-16 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Nenhum cliente ainda</h3>
          <Link href="/clients/new" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-xl text-sm font-semibold mt-4 transition-all">
            <Plus className="w-4 h-4" />Adicionar cliente
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <div key={client.id} className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-brand-500/20 transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 bg-brand-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-400 font-bold text-sm uppercase">{client.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{client.name}</h3>
                  {client.document && <p className="text-slate-500 text-xs mt-0.5">{client.document}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                {client.email && <div className="flex items-center gap-2 text-slate-400 text-xs"><Mail className="w-3.5 h-3.5" /><span className="truncate">{client.email}</span></div>}
                {client.phone && <div className="flex items-center gap-2 text-slate-400 text-xs"><Phone className="w-3.5 h-3.5" /><span>{client.phone}</span></div>}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <Link href={`/receipts/new?client=${client.id}`} className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">
                  <FileText className="w-3.5 h-3.5" />Criar recibo
                </Link>
                <Link href={`/clients/${client.id}`} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Ver detalhes →</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
