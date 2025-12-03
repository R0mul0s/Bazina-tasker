-- ============================================
-- Migration: 001_create_profiles
-- Popis: Vytvoření tabulky profiles pro uživatelské profily
-- ============================================

-- Vytvoření tabulky profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komentáře k tabulce
COMMENT ON TABLE public.profiles IS 'Uživatelské profily propojené s auth.users';
COMMENT ON COLUMN public.profiles.id IS 'ID uživatele (FK na auth.users)';
COMMENT ON COLUMN public.profiles.email IS 'Email uživatele';
COMMENT ON COLUMN public.profiles.full_name IS 'Celé jméno uživatele';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL avataru uživatele';

-- ============================================
-- Trigger pro automatickou aktualizaci updated_at
-- ============================================

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

-- ============================================
-- Trigger pro automatické vytvoření profilu při registraci
-- ============================================

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

-- Trigger na auth.users - spustí se při vytvoření nového uživatele
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Povolení RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatel může číst pouze svůj profil
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Uživatel může aktualizovat pouze svůj profil
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Profil se vytváří automaticky přes trigger (SECURITY DEFINER)
-- Není potřeba INSERT policy pro uživatele

-- ============================================
-- Indexy
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
