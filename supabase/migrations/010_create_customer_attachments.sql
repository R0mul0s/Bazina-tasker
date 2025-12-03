-- ============================================
-- Migration: 010_create_customer_attachments
-- Popis: Vytvoření tabulky pro přílohy zákazníků
-- ============================================

-- Vytvoření tabulky customer_attachments
CREATE TABLE IF NOT EXISTS public.customer_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komentáře k tabulce
COMMENT ON TABLE public.customer_attachments IS 'Přílohy zákazníků (smlouvy, dokumenty, obrázky)';
COMMENT ON COLUMN public.customer_attachments.file_url IS 'Cesta k souboru v Supabase Storage';
COMMENT ON COLUMN public.customer_attachments.file_type IS 'MIME type souboru';
COMMENT ON COLUMN public.customer_attachments.file_size IS 'Velikost souboru v bytech';
COMMENT ON COLUMN public.customer_attachments.description IS 'Popis souboru (volitelné)';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.customer_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel vidí pouze své přílohy
CREATE POLICY "Users can view own customer attachments"
    ON public.customer_attachments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Uživatel může vytvářet přílohy pod svým účtem
CREATE POLICY "Users can create own customer attachments"
    ON public.customer_attachments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může mazat pouze své přílohy
CREATE POLICY "Users can delete own customer attachments"
    ON public.customer_attachments
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_customer_attachments_customer_id ON public.customer_attachments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_attachments_user_id ON public.customer_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_attachments_created_at ON public.customer_attachments(created_at DESC);
