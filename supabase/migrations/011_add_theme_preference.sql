-- ============================================
-- Migration: 011_add_theme_preference
-- Popis: Přidání sloupce pro preferenci motivu
-- ============================================

-- Přidání sloupce theme_preference do profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'light';

-- Komentář
COMMENT ON COLUMN public.profiles.theme_preference IS 'Preference motivu: light nebo dark';
