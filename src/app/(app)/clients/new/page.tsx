'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDocument } from '@/lib/utils'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('clients').insert({
      user_id: user.id,
      ...form,
    })

    if (!error) {
      router.push('/clients')
    } else {
      alert('Erro ao salvar cliente.')
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
  const labelClass = "block text-slate-400 text-xs font-medium mb-1.5"

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Cliente</h1>
          <p className="text-slate-400 text-sm">Cadastre um novo cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <div>
            <label className={labelClass}>Nome completo / Razão social *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="João Silva ou Empresa Ltda."
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>CPF / CNPJ</label>
            <input
              type="text"
              value={form.document}
              onChange={e => setForm(p => ({ ...p, document: formatDocument(e.target.value) }))}
              placeholder="000.000.000-00"
              className={inputClass}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="cliente@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="(41) 99999-9999"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Endereço</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="Rua, número, bairro, cidade - UF"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Link
            href="/clients"
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium text-sm transition-colors text-center border border-white/10"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
