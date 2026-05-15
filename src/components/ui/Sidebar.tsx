'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, LayoutDashboard, Users, Settings,
  LogOut, Menu, X, ChevronRight, CreditCard
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/receipts', label: 'Recibos', icon: FileText },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/settings', label: 'Configurações', icon: Settings },
  { href: '/billing', label: 'Planos', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário')
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-white text-lg">ReciboFácil</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 text-xs font-bold uppercase">{userName.charAt(0) || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userName}</p>
            <p className="text-slate-500 text-xs">Conta ativa</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col bg-slate-900 border-r border-white/5 fixed inset-y-0 left-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile burger — fixed position, always visible */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-40 w-9 h-9 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
        aria-label="Abrir menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-slate-900 flex flex-col shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
