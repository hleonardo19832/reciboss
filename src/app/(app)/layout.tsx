import { Sidebar } from '@/components/ui/Sidebar'
import { Bell } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/5 pl-16 pr-6 lg:px-6 py-4 flex items-center justify-end sticky top-0 z-10">
          <button className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
