-- ============================================
-- BAZINA TASKER - Kompletní databázový setup
-- ============================================
-- Tento soubor obsahuje všechny migrace v jednom.
-- Spusťte ho v Supabase SQL Editoru.
-- ============================================


-- ============================================
-- 1. PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funkce pro updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Automatické vytvoření profilu při registraci
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);


-- ============================================
-- 2. CUSTOMERS
-- ============================================

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

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers"
    ON public.customers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own customers" ON public.customers;
CREATE POLICY "Users can create own customers"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
CREATE POLICY "Users can update own customers"
    ON public.customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
CREATE POLICY "Users can delete own customers"
    ON public.customers FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);


-- ============================================
-- 3. TAGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6b7280',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON public.tags(user_id, name);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tags" ON public.tags;
CREATE POLICY "Users can view own tags"
    ON public.tags FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own tags" ON public.tags;
CREATE POLICY "Users can create own tags"
    ON public.tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tags" ON public.tags;
CREATE POLICY "Users can update own tags"
    ON public.tags FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tags" ON public.tags;
CREATE POLICY "Users can delete own tags"
    ON public.tags FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);


-- ============================================
-- 4. NOTES
-- ============================================

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

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
CREATE POLICY "Users can view own notes"
    ON public.notes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own notes" ON public.notes;
CREATE POLICY "Users can create own notes"
    ON public.notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
CREATE POLICY "Users can update own notes"
    ON public.notes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
CREATE POLICY "Users can delete own notes"
    ON public.notes FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_customer_id ON public.notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_notes_meeting_date ON public.notes(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_notes_follow_up_date ON public.notes(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_notes_status ON public.notes(status);


-- ============================================
-- 5. NOTE_TAGS (M:N)
-- ============================================

CREATE TABLE IF NOT EXISTS public.note_tags (
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own note_tags" ON public.note_tags;
CREATE POLICY "Users can view own note_tags"
    ON public.note_tags FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create own note_tags" ON public.note_tags;
CREATE POLICY "Users can create own note_tags"
    ON public.note_tags FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own note_tags" ON public.note_tags;
CREATE POLICY "Users can delete own note_tags"
    ON public.note_tags FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));


-- ============================================
-- 6. NOTE_TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS public.note_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.note_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own note_tasks" ON public.note_tasks;
CREATE POLICY "Users can view own note_tasks"
    ON public.note_tasks FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tasks.note_id AND notes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create own note_tasks" ON public.note_tasks;
CREATE POLICY "Users can create own note_tasks"
    ON public.note_tasks FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tasks.note_id AND notes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own note_tasks" ON public.note_tasks;
CREATE POLICY "Users can update own note_tasks"
    ON public.note_tasks FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tasks.note_id AND notes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own note_tasks" ON public.note_tasks;
CREATE POLICY "Users can delete own note_tasks"
    ON public.note_tasks FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tasks.note_id AND notes.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_note_tasks_note_id ON public.note_tasks(note_id);


-- ============================================
-- 7. ATTACHMENTS
-- ============================================

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

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attachments" ON public.attachments;
CREATE POLICY "Users can view own attachments"
    ON public.attachments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own attachments" ON public.attachments;
CREATE POLICY "Users can create own attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;
CREATE POLICY "Users can delete own attachments"
    ON public.attachments FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON public.attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON public.attachments(user_id);


-- ============================================
-- 8. STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'attachments',
    'attachments',
    false,
    52428800,
    ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload own attachments" ON storage.objects;
CREATE POLICY "Users can upload own attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view own attachments" ON storage.objects;
CREATE POLICY "Users can view own attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
CREATE POLICY "Users can delete own attachments"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================
-- HOTOVO!
-- ============================================
