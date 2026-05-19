'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Se vier redirecionado do cadastro, pega o email da URL e preenche sozinho
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) setEmail(emailParam)

    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/dashboard'
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      }
    })

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      subscription.unsubscribe()
      // Como não podemos distinguir entre senha errada e conta inexistente (por segurança),
      // apenas exibimos um alerta claro para o usuário:
      setError('Senha incorreta ou e-mail não cadastrado.')
      setLoading(false)
      return
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-white mb-2">Bem-vindo de volta</h2>
      <p className="text-slate-400 mb-8">Entre na sua conta para continuar</p>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-slate-400 text-sm mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-2">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="text-center text-slate-400 text-sm mt-6">
        Não tem uma conta?{' '}
        <Link href="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium">
          Criar conta grátis
        </Link>
      </p>
    </div>
  )
}
