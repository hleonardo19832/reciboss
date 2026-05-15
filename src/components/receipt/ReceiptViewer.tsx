'use client'

import { useState } from 'react'
import { Receipt, Profile } from '@/lib/types'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'
import { Download, Printer, CheckCircle, Clock, XCircle, Building2, User } from 'lucide-react'

interface Props {
  receipt: Receipt & { clients?: any }
  profile: Profile | null
}

export default function ReceiptViewer({ receipt, profile }: Props) {
  const [downloading, setDownloading] = useState(false)
  const status = STATUS_LABELS[receipt.status]

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const element = document.getElementById('receipt-document')!
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${receipt.receipt_number}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center gap-3 justify-end no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/25"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Gerando PDF...' : 'Baixar PDF'}
        </button>
      </div>

      {/* Receipt document */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" id="receipt-document">
        {/* Header */}
        <div className="bg-slate-900 px-10 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl font-display">
                  {profile?.company_name || profile?.full_name || 'Minha Empresa'}
                </h2>
                {profile?.company_document && (
                  <p className="text-slate-400 text-sm mt-0.5">CNPJ/CPF: {profile.company_document}</p>
                )}
                {profile?.company_address && (
                  <p className="text-slate-400 text-sm">{profile.company_address}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-1">Recibo</p>
              <p className="text-white font-bold font-mono text-lg">{receipt.receipt_number}</p>
              <p className="text-slate-400 text-sm mt-1">{formatDate(receipt.issue_date)}</p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className={`px-10 py-3 flex items-center gap-2 ${
          receipt.status === 'paid' ? 'bg-emerald-50' :
          receipt.status === 'pending' ? 'bg-amber-50' :
          'bg-red-50'
        }`}>
          {receipt.status === 'paid' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
          {receipt.status === 'pending' && <Clock className="w-4 h-4 text-amber-600" />}
          {receipt.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-600" />}
          <span className={`text-sm font-semibold ${
            receipt.status === 'paid' ? 'text-emerald-700' :
            receipt.status === 'pending' ? 'text-amber-700' :
            'text-red-700'
          }`}>
            {status.label}
            {receipt.payment_method && receipt.status === 'paid' && ` · Pago via ${receipt.payment_method}`}
          </span>
        </div>

        {/* Body */}
        <div className="px-10 py-8">
          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-2">Emissor</p>
              <p className="text-slate-900 font-semibold">{profile?.company_name || profile?.full_name || 'N/A'}</p>
              {profile?.company_email && <p className="text-slate-500 text-sm">{profile.company_email}</p>}
              {profile?.company_phone && <p className="text-slate-500 text-sm">{profile.company_phone}</p>}
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-2">Recebido de</p>
              {receipt.clients ? (
                <>
                  <p className="text-slate-900 font-semibold">{receipt.clients.name}</p>
                  {receipt.clients.document && <p className="text-slate-500 text-sm">CPF/CNPJ: {receipt.clients.document}</p>}
                  {receipt.clients.email && <p className="text-slate-500 text-sm">{receipt.clients.email}</p>}
                  {receipt.clients.phone && <p className="text-slate-500 text-sm">{receipt.clients.phone}</p>}
                  {receipt.clients.address && <p className="text-slate-500 text-sm">{receipt.clients.address}</p>}
                </>
              ) : (
                <p className="text-slate-400 italic text-sm">Cliente não informado</p>
              )}
            </div>
          </div>

          {receipt.description && (
            <div className="mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-2">Descrição</p>
              <p className="text-slate-700 text-sm">{receipt.description}</p>
            </div>
          )}

          {/* Items table */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="text-left text-slate-900 text-xs font-bold uppercase tracking-wider pb-3">Descrição</th>
                  <th className="text-right text-slate-900 text-xs font-bold uppercase tracking-wider pb-3 w-20">Qtd.</th>
                  <th className="text-right text-slate-900 text-xs font-bold uppercase tracking-wider pb-3 w-28">Preço Unit.</th>
                  <th className="text-right text-slate-900 text-xs font-bold uppercase tracking-wider pb-3 w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-3 text-slate-700 text-sm">{item.description}</td>
                    <td className="py-3 text-right text-slate-600 text-sm">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600 text-sm">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right text-slate-800 font-medium text-sm">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-700">{formatCurrency(Number(receipt.subtotal))}</span>
              </div>
              {Number(receipt.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Desconto</span>
                  <span className="text-red-600">- {formatCurrency(Number(receipt.discount))}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center">
                <span className="text-slate-900 font-bold text-base">TOTAL</span>
                <span className="text-slate-900 font-bold text-2xl font-display">
                  {formatCurrency(Number(receipt.total))}
                </span>
              </div>
              {receipt.currency !== 'BRL' && (
                <p className="text-slate-400 text-xs text-right">Moeda: {receipt.currency}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Observações</p>
              <p className="text-slate-600 text-sm">{receipt.notes}</p>
            </div>
          )}

          {/* Dates */}
          <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div>
              <p className="text-slate-400 text-xs">Data de emissão</p>
              <p className="text-slate-700 text-sm font-medium">{formatDate(receipt.issue_date)}</p>
            </div>
            {receipt.due_date && (
              <div>
                <p className="text-slate-400 text-xs">Data de vencimento</p>
                <p className="text-slate-700 text-sm font-medium">{formatDate(receipt.due_date)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-10 py-4 flex items-center justify-between">
          <p className="text-slate-400 text-xs">
            Recibo gerado em {new Date().toLocaleDateString('pt-BR')} · ReciboFácil
          </p>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-brand-500 rounded flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">R</span>
            </div>
            <span className="text-slate-400 text-xs font-medium">ReciboFácil</span>
          </div>
        </div>
      </div>
    </div>
  )
}
