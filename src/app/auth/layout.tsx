import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255,255,255) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
        </div>
        <div className="relative text-center">
          <div className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/30">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-4">
            FinHub
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Gerencie suas finanças de forma profissional e organizada.
          </p>
          <div className="mt-12 space-y-3">
            {[
              '✓ Contas a receber completo',
              '✓ Recibos profissionais em PDF',
              '✓ Gestão completa de clientes',
              '✓ Dados seguros e privados',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-400 text-sm justify-center">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">FinHub</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
