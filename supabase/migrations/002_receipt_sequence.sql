-- Add a sequence counter per user for sequential receipt numbers
CREATE TABLE IF NOT EXISTS public.receipt_sequences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  last_number INTEGER DEFAULT 0
);

ALTER TABLE public.receipt_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sequence"
  ON public.receipt_sequences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to generate next receipt number for a user
CREATE OR REPLACE FUNCTION public.get_next_receipt_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_number INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  INSERT INTO public.receipt_sequences (user_id, last_number)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET last_number = receipt_sequences.last_number + 1
  RETURNING last_number INTO v_number;
  
  RETURN 'REC-' || v_year || '-' || LPAD(v_number::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
