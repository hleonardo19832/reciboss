import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
          <FileQuestion className="w-10 h-10 text-slate-600" />
        </div>
        <h1 className="font-display text-4xl font-bold text-white mb-3">404</h1>
        <p className="text-slate-400 text-lg mb-8">Página não encontrada</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard" className="bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-brand-500/25">
            Ir para o Dashboard
          </Link>
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl text-sm font-medium transition-colors border border-white/10">
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
