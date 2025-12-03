-- ============================================
-- Migration: 006_create_note_tasks
-- Popis: Vytvoření tabulky note_tasks pro úkoly v poznámkách
-- ============================================

-- Vytvoření tabulky note_tasks
CREATE TABLE IF NOT EXISTS public.note_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komentáře k tabulce
COMMENT ON TABLE public.note_tasks IS 'Úkoly/checkboxy v poznámkách';
COMMENT ON COLUMN public.note_tasks."order" IS 'Pořadí úkolu v seznamu';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.note_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel vidí pouze úkoly svých poznámek
CREATE POLICY "Users can view own note_tasks"
    ON public.note_tasks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tasks.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- Policy: Uživatel může vytvářet úkoly ve svých poznámkách
CREATE POLICY "Users can create own note_tasks"
    ON public.note_tasks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tasks.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- Policy: Uživatel může upravovat úkoly ve svých poznámkách
CREATE POLICY "Users can update own note_tasks"
    ON public.note_tasks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tasks.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- Policy: Uživatel může mazat úkoly ze svých poznámek
CREATE POLICY "Users can delete own note_tasks"
    ON public.note_tasks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tasks.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_note_tasks_note_id ON public.note_tasks(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tasks_order ON public.note_tasks(note_id, "order");
