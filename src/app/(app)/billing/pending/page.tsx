import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function BillingPendingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-yellow-400" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">Pagamento pendente</h1>
        <p className="text-slate-400 mb-2">Seu pagamento está sendo processado.</p>
        <p className="text-slate-500 text-sm mb-8">
          Se pagou via boleto, pode levar até 3 dias úteis para compensar.
          Via PIX, a ativação é imediata.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-8 py-3 rounded-xl font-semibold transition-all">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
