import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-slate-400 text-sm">Carregando...</p>
      </div>
    </div>
  )
}
