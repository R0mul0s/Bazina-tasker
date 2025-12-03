-- ============================================
-- Migration: 008_create_storage
-- Popis: Vytvoření Storage bucketu pro přílohy
-- ============================================

-- Vytvoření bucketu pro přílohy
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'attachments',
    'attachments',
    false,
    52428800, -- 50MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies
-- ============================================

-- Policy: Uživatel může nahrávat soubory do své složky
CREATE POLICY "Users can upload own attachments"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'attachments'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Uživatel může číst své soubory
CREATE POLICY "Users can view own attachments"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'attachments'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Uživatel může mazat své soubory
CREATE POLICY "Users can delete own attachments"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'attachments'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
