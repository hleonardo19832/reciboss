'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (signUpError) {
      setError(signUpError.message.includes('already registered')
        ? 'Este email já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Conta criada! Faça login para continuar.')
      setLoading(false)
      return
    }

    setSuccess(true)
    window.location.href = '/dashboard'
  }

  if (success) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-brand-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Conta criada!</h2>
        <p className="text-slate-400 text-sm">Redirecionando...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-white mb-2">Criar sua conta</h2>
      <p className="text-slate-400 mb-8">Gratuito. Sem cartão de crédito.</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-slate-400 text-sm mb-2">Seu nome</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="João Silva" required
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-2">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" required minLength={6}
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Criando conta...' : 'Criar conta grátis'}
        </button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Já tem uma conta?{' '}
        <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Entrar</Link>
      </p>
    </div>
  )
}
