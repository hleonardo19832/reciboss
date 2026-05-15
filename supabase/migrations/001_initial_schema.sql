-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  company_name TEXT,
  company_document TEXT, -- CNPJ/CPF
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  document TEXT, -- CPF/CNPJ
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RECEIPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  receipt_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  description TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Clients RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- Receipts RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts"
  ON public.receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON public.receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON public.receipts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts"
  ON public.receipts FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
