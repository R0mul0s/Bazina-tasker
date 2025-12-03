-- ============================================
-- Migration: 005_create_note_tags
-- Popis: Vytvoření vazební tabulky note_tags (M:N)
-- ============================================

-- Vytvoření vazební tabulky
CREATE TABLE IF NOT EXISTS public.note_tags (
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

-- Komentáře k tabulce
COMMENT ON TABLE public.note_tags IS 'Vazební tabulka mezi poznámkami a tagy (M:N)';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel vidí pouze vazby svých poznámek
CREATE POLICY "Users can view own note_tags"
    ON public.note_tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tags.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- Policy: Uživatel může přidávat tagy ke svým poznámkám
CREATE POLICY "Users can create own note_tags"
    ON public.note_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tags.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- Policy: Uživatel může mazat tagy ze svých poznámek
CREATE POLICY "Users can delete own note_tags"
    ON public.note_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tags.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);
