-- ============================================
-- Migration: 002_create_customers
-- Popis: Vytvoření tabulky customers pro zákazníky
-- ============================================

-- Vytvoření tabulky customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komentáře k tabulce
COMMENT ON TABLE public.customers IS 'Zákazníci uživatele';
COMMENT ON COLUMN public.customers.name IS 'Jméno kontaktní osoby';
COMMENT ON COLUMN public.customers.company IS 'Název firmy';
COMMENT ON COLUMN public.customers.notes IS 'Obecné poznámky k zákazníkovi';

-- ============================================
-- Trigger pro automatickou aktualizaci updated_at
-- ============================================

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel vidí pouze své zákazníky
CREATE POLICY "Users can view own customers"
    ON public.customers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Uživatel může vytvářet zákazníky pod svým účtem
CREATE POLICY "Users can create own customers"
    ON public.customers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může upravovat pouze své zákazníky
CREATE POLICY "Users can update own customers"
    ON public.customers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může mazat pouze své zákazníky
CREATE POLICY "Users can delete own customers"
    ON public.customers
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Full-text search index pro vyhledávání
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers
    USING GIN (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(company, '') || ' ' || coalesce(email, '')));
