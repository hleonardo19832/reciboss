'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('clients').select('*').eq('id', params.id).eq('user_id', user.id).single()
      if (!data) { router.push('/clients'); return }
      setForm({
        name: data.name || '',
        document: data.document || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      })
      setPageLoading(false)
    })
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('clients').update(form).eq('id', params.id)
    if (!error) {
      router.push(`/clients/${params.id}`)
    } else {
      alert('Erro ao salvar.')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('clients').delete().eq('id', params.id)
    if (!error) {
      router.push('/clients')
    } else {
      alert('Erro ao excluir.')
      setDeleting(false)
    }
  }

  const inputClass = "w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
  const labelClass = "block text-slate-400 text-xs font-medium mb-1.5"

  if (pageLoading) return <div className="flex justify-center items-center min-h-64"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/clients/${params.id}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Cliente</h1>
            <p className="text-slate-400 text-sm">{form.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm transition-all border border-red-500/20 hover:border-red-500/40"
        >
          Excluir
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Excluir cliente?</h3>
                <p className="text-slate-400 text-sm">Os recibos relacionados não serão excluídos.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <div>
            <label className={labelClass}>Nome completo / Razão social *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>CPF / CNPJ</label>
            <input type="text" value={form.document} onChange={e => setForm(p => ({ ...p, document: e.target.value }))} placeholder="000.000.000-00" className={inputClass} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Endereço</label>
            <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Link href={`/clients/${params.id}`} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium text-sm transition-colors text-center border border-white/10">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
