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
