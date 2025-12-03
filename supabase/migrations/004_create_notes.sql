-- ============================================
-- Migration: 004_create_notes
-- Popis: Vytvoření tabulky notes pro poznámky z jednání
-- ============================================

-- Vytvoření ENUM typů
DO $$ BEGIN
    CREATE TYPE meeting_type AS ENUM ('in_person', 'phone', 'video', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE note_status AS ENUM ('draft', 'completed', 'requires_action');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE note_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vytvoření tabulky notes
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    meeting_date DATE,
    meeting_type meeting_type DEFAULT 'in_person',
    status note_status DEFAULT 'draft',
    priority note_priority DEFAULT 'medium',
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komentáře k tabulce
COMMENT ON TABLE public.notes IS 'Poznámky z jednání se zákazníky';
COMMENT ON COLUMN public.notes.content IS 'Obsah poznámky (rich text JSON)';
COMMENT ON COLUMN public.notes.meeting_type IS 'Typ jednání: in_person, phone, video, email';
COMMENT ON COLUMN public.notes.status IS 'Stav: draft, completed, requires_action';
COMMENT ON COLUMN public.notes.priority IS 'Priorita: low, medium, high';
COMMENT ON COLUMN public.notes.follow_up_date IS 'Datum pro follow-up';

-- ============================================
-- Trigger pro automatickou aktualizaci updated_at
-- ============================================

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel vidí pouze své poznámky
CREATE POLICY "Users can view own notes"
    ON public.notes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Uživatel může vytvářet poznámky pod svým účtem
CREATE POLICY "Users can create own notes"
    ON public.notes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může upravovat pouze své poznámky
CREATE POLICY "Users can update own notes"
    ON public.notes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Uživatel může mazat pouze své poznámky
CREATE POLICY "Users can delete own notes"
    ON public.notes
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_customer_id ON public.notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_notes_meeting_date ON public.notes(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_notes_follow_up_date ON public.notes(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_notes_status ON public.notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_priority ON public.notes(priority);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_notes_search ON public.notes
    USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')));
