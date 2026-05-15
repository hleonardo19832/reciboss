import { Sidebar } from '@/components/ui/Sidebar'
import Link from 'next/link'
import { Plus, Bell } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/5 pl-16 pr-6 lg:px-6 py-4 flex items-center justify-end sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <Link href="/receipts/new" className="bg-brand-500 hover:bg-brand-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/25 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Novo Recibo
            </Link>
          </div>
        </header>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
