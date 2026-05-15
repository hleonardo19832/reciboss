import { Suspense } from 'react'
import NewReceiptForm from './NewReceiptForm'
import { Loader2 } from 'lucide-react'

export default function NewReceiptPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    }>
      <NewReceiptForm />
    </Suspense>
  )
}
