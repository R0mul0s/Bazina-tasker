-- ============================================
-- Migration: 009_create_time_entries
-- Popis: Vytvoření tabulky pro evidenci stráveného času
-- ============================================

-- Vytvoření tabulky time_entries
CREATE TABLE IF NOT EXISTS public.note_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    description VARCHAR(255),
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komentáře k tabulce
COMMENT ON TABLE public.note_time_entries IS 'Evidence stráveného času na poznámkách';
COMMENT ON COLUMN public.note_time_entries.duration_minutes IS 'Strávený čas v minutách';
COMMENT ON COLUMN public.note_time_entries.description IS 'Popis činnosti (volitelné)';
COMMENT ON COLUMN public.note_time_entries.entry_date IS 'Datum, ke kterému se čas vztahuje';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.note_time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel vidí pouze své záznamy
CREATE POLICY "Users can view own time entries"
    ON public.note_time_entries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Uživatel může vytvářet záznamy pod svým účtem
CREATE POLICY "Users can create own time entries"
    ON public.note_time_entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může upravovat své záznamy
CREATE POLICY "Users can update own time entries"
    ON public.note_time_entries
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Uživatel může mazat pouze své záznamy
CREATE POLICY "Users can delete own time entries"
    ON public.note_time_entries
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_time_entries_note_id ON public.note_time_entries(note_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.note_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_entry_date ON public.note_time_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON public.note_time_entries(created_at DESC);
