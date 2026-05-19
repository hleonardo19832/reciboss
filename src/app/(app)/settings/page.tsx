'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, Upload, X, ImageIcon, Lock } from 'lucide-react'
import { formatDocument, formatPhone } from '@/lib/utils'
import { hasLogoSignatureFeature } from '@/lib/subscription'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileSignatureInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    full_name: '', company_name: '', company_document: '',
    company_address: '', company_phone: '', company_email: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            setForm({
              full_name: data.full_name || '',
              company_name: data.company_name || '',
              company_document: data.company_document || '',
              company_address: data.company_address || '',
              company_phone: data.company_phone || '',
              company_email: data.company_email || '',
            })
            setLogoUrl(data.company_logo_url || null)
            setSignatureUrl(data.company_signature_url || null)
          }
        })
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single().then(({ data }) => {
          setSubscription(data)
        })
      }
    })
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.')
      return
    }

    setUploadingLogo(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `logos/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      alert('Erro ao fazer upload. Verifique se o bucket "logos" foi criado no Supabase Storage.')
      setUploadingLogo(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

    await supabase.from('profiles').update({ company_logo_url: publicUrl }).eq('id', user.id)

    setLogoUrl(publicUrl)
    setUploadingLogo(false)
  }

  const handleRemoveLogo = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ company_logo_url: null }).eq('id', user.id)
    setLogoUrl(null)
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('A assinatura deve ter no máximo 2MB.')
      return
    }

    setUploadingSignature(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `signatures/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      alert('Erro ao fazer upload da assinatura. Verifique se o bucket "logos" foi criado no Supabase Storage.')
      setUploadingSignature(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

    await supabase.from('profiles').update({ company_signature_url: publicUrl }).eq('id', user.id)

    setSignatureUrl(publicUrl)
    setUploadingSignature(false)
  }

  const handleRemoveSignature = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ company_signature_url: null }).eq('id', user.id)
    setSignatureUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({ id: user.id, ...form })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputClass = "w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
  const labelClass = "block text-slate-400 text-xs font-medium mb-1.5"

  const canUploadMedia = hasLogoSignatureFeature(subscription)

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 text-sm mt-1">Configure os dados que aparecerão nos recibos</p>
      </div>

      {/* Logo upload */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Logo da empresa</h2>
          <p className="text-slate-400 text-xs mb-4">Aparecerá no cabeçalho dos recibos. Máximo 2MB.</p>

          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <img src={logoUrl} alt="Logo" className="w-20 h-20 rounded-xl object-cover bg-slate-800 border border-white/10" />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-800 border border-white/10 border-dashed flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-600" />
              </div>
            )}

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {canUploadMedia ? (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10"
                  >
                    {uploadingLogo
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Upload className="w-4 h-4" />}
                    {uploadingLogo ? 'Enviando...' : logoUrl ? 'Trocar logo' : 'Fazer upload'}
                  </button>
                  <p className="text-slate-500 text-xs mt-2">PNG, JPG, SVG ou WEBP</p>
                </>
              ) : (
                <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-400" />
                    <span className="text-slate-300 text-xs">Exclusivo do plano Pro</span>
                  </div>
                  <a href="/billing" className="text-brand-400 text-xs font-semibold hover:text-brand-300 transition-colors">
                    Fazer upgrade
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Signature upload */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Assinatura da empresa</h2>
          <p className="text-slate-400 text-xs mb-4">Aparecerá no rodapé dos recibos. Máximo 2MB.</p>

          <div className="flex items-center gap-4">
            {signatureUrl ? (
              <div className="relative">
                <img src={signatureUrl} alt="Assinatura" className="w-20 h-20 rounded-xl object-contain bg-white p-2 border border-white/10" />
                <button
                  onClick={handleRemoveSignature}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-800 border border-white/10 border-dashed flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-600" />
              </div>
            )}

            <div className="flex-1">
              <input
                ref={fileSignatureInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleSignatureUpload}
                className="hidden"
              />
              {canUploadMedia ? (
                <>
                  <button
                    onClick={() => fileSignatureInputRef.current?.click()}
                    disabled={uploadingSignature}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10"
                  >
                    {uploadingSignature
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Upload className="w-4 h-4" />}
                    {uploadingSignature ? 'Enviando...' : signatureUrl ? 'Trocar assinatura' : 'Fazer upload'}
                  </button>
                  <p className="text-slate-500 text-xs mt-2">PNG, JPG, SVG ou WEBP</p>
                </>
              ) : (
                <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-400" />
                    <span className="text-slate-300 text-xs">Exclusivo do plano Pro</span>
                  </div>
                  <a href="/billing" className="text-brand-400 text-xs font-semibold hover:text-brand-300 transition-colors">
                    Fazer upgrade
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Dados Pessoais</h2>
          <div>
            <label className={labelClass}>Seu nome</label>
            <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="João Silva" className={inputClass} />
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Dados da Empresa</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nome da empresa</label>
              <input type="text" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Minha Empresa Ltda." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>CNPJ / CPF</label>
              <input type="text" value={form.company_document} onChange={e => setForm(p => ({ ...p, company_document: formatDocument(e.target.value) }))} placeholder="12.345.678/0001-90" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Endereço</label>
              <input type="text" value={form.company_address} onChange={e => setForm(p => ({ ...p, company_address: e.target.value }))} placeholder="Rua das Flores, 123 - Cidade/UF" className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Telefone Comercial</label>
                <input type="tel" value={form.company_phone} onChange={e => setForm(p => ({ ...p, company_phone: formatPhone(e.target.value) }))} placeholder="(00) 00000-0000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.company_email} onChange={e => setForm(p => ({ ...p, company_email: e.target.value }))} placeholder="contato@empresa.com" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved && <CheckCircle className="w-4 h-4" />}
          {loading ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}
