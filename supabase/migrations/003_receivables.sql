-- =============================================
-- CONTAS A RECEBER
-- =============================================
CREATE TABLE IF NOT EXISTS public.receivables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partial')),
  payment_method TEXT,
  category TEXT DEFAULT 'servico' CHECK (category IN ('servico', 'produto', 'aluguel', 'consultoria', 'mensalidade', 'outro')),
  recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'weekly', 'monthly', 'quarterly', 'yearly')),
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  installment_group_id UUID,
  notes TEXT,
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receivables" ON public.receivables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own receivables" ON public.receivables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own receivables" ON public.receivables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own receivables" ON public.receivables FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.update_overdue_receivables()
RETURNS void AS $$
BEGIN
  UPDATE public.receivables
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
