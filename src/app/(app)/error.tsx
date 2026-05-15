'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Algo deu errado</h2>
        <p className="text-slate-400 text-sm mb-6">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
