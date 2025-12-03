-- ============================================
-- Migration: 003_create_tags
-- Popis: Vytvoření tabulky tags pro štítky
-- ============================================

-- Vytvoření tabulky tags
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6b7280',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komentáře k tabulce
COMMENT ON TABLE public.tags IS 'Štítky pro kategorizaci poznámek';
COMMENT ON COLUMN public.tags.color IS 'Hex barva tagu (např. #3b82f6)';

-- Unikátní kombinace user_id + name (uživatel nemůže mít dva tagy se stejným názvem)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON public.tags(user_id, name);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel vidí pouze své tagy
CREATE POLICY "Users can view own tags"
    ON public.tags
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Uživatel může vytvářet tagy pod svým účtem
CREATE POLICY "Users can create own tags"
    ON public.tags
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může upravovat pouze své tagy
CREATE POLICY "Users can update own tags"
    ON public.tags
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může mazat pouze své tagy
CREATE POLICY "Users can delete own tags"
    ON public.tags
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
