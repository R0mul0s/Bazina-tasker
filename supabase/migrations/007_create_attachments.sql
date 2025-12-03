-- ============================================
-- Migration: 007_create_attachments
-- Popis: Vytvoření tabulky attachments pro přílohy
-- ============================================

-- Vytvoření tabulky attachments
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komentáře k tabulce
COMMENT ON TABLE public.attachments IS 'Přílohy k poznámkám (obrázky, PDF, dokumenty)';
COMMENT ON COLUMN public.attachments.file_url IS 'URL souboru v Supabase Storage';
COMMENT ON COLUMN public.attachments.file_type IS 'MIME type souboru';
COMMENT ON COLUMN public.attachments.file_size IS 'Velikost souboru v bytech';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel vidí pouze své přílohy
CREATE POLICY "Users can view own attachments"
    ON public.attachments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Uživatel může vytvářet přílohy pod svým účtem
CREATE POLICY "Users can create own attachments"
    ON public.attachments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může mazat pouze své přílohy
CREATE POLICY "Users can delete own attachments"
    ON public.attachments
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON public.attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON public.attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON public.attachments(created_at DESC);
