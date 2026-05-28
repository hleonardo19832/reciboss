export interface Profile {
  id: string
  full_name: string | null
  company_name: string | null
  company_document: string | null
  company_address: string | null
  company_phone: string | null
  company_email: string | null
  company_logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  document: string | null
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface ReceiptItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Receipt {
  id: string
  user_id: string
  client_id: string | null
  receipt_number: string
  issue_date: string
  due_date: string | null
  description: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  total: number
  currency: string
  payment_method: string | null
  status: 'paid' | 'pending' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
  clients?: Client
}

export interface DashboardStats {
  total_receipts: number
  total_revenue: number
  pending_count: number
  this_month_revenue: number
}

export interface Receivable {
  id: string
  user_id: string
  client_id: string | null
  title: string
  description: string | null
  amount: number
  amount_paid: number
  due_date: string
  payment_date: string | null
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial'
  payment_method: string | null
  category: 'servico' | 'produto' | 'aluguel' | 'consultoria' | 'mensalidade' | 'outro'
  recurrence: 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  installment_number: number
  total_installments: number
  installment_group_id: string | null
  notes: string | null
  receipt_id: string | null
  created_at: string
  updated_at: string
  clients?: { name: string; email: string | null; phone: string | null }
}

export const RECEIVABLE_STATUS = {
  pending:   { label: 'Pendente',   color: 'yellow', bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  paid:      { label: 'Pago',       color: 'green',  bg: 'bg-brand-500/15',  text: 'text-brand-400'  },
  overdue:   { label: 'Vencido',    color: 'red',    bg: 'bg-red-500/15',    text: 'text-red-400'    },
  cancelled: { label: 'Cancelado',  color: 'gray',   bg: 'bg-slate-500/15',  text: 'text-slate-400'  },
  partial:   { label: 'Parcial',    color: 'blue',   bg: 'bg-blue-500/15',   text: 'text-blue-400'   },
}

