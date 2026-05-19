'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react'
import ReceiptViewer from '@/components/receipt/ReceiptViewer'

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [receipt, setReceipt] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      const [{ data: r }, { data: p }, { data: s }] = await Promise.all([
        supabase.from('receipts').select('*, clients(*)').eq('id', params.id).eq('user_id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single()
      ])
      if (!r) { router.replace('/receipts'); return }
      setReceipt(r)
      setProfile(p)
      setSubscription(s)
      setLoading(false)
    })
  }, [params.id, router])

  if (loading) return <div className="flex justify-center items-center min-h-96"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/receipts" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">{receipt.receipt_number}</h1>
            <p className="text-slate-400 text-sm">Visualização do recibo</p>
          </div>
        </div>
        <Link href={`/receipts/${params.id}/edit`} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
          <Pencil className="w-4 h-4" />Editar
        </Link>
      </div>
      <ReceiptViewer receipt={receipt} profile={profile} subscription={subscription} />
    </div>
  )
}
