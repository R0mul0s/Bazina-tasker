-- Přidání sloupců pro sdílení poznámek
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ DEFAULT NULL;

-- Index pro rychlé vyhledávání podle share_token
CREATE INDEX IF NOT EXISTS idx_notes_share_token ON notes(share_token) WHERE share_token IS NOT NULL;

-- RLS policy pro veřejný přístup ke sdíleným poznámkám (bez autentizace)
CREATE POLICY "Veřejný přístup ke sdíleným poznámkám"
ON notes FOR SELECT
TO anon
USING (is_shared = true AND share_token IS NOT NULL);

-- Policy pro čtení tagů sdílených poznámek
CREATE POLICY "Veřejný přístup k tagům sdílených poznámek"
ON note_tags FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM notes
    WHERE notes.id = note_tags.note_id
    AND notes.is_shared = true
    AND notes.share_token IS NOT NULL
  )
);

-- Policy pro čtení tagů (metadata) u sdílených poznámek
CREATE POLICY "Veřejný přístup k tag metadatům"
ON tags FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM note_tags
    JOIN notes ON notes.id = note_tags.note_id
    WHERE note_tags.tag_id = tags.id
    AND notes.is_shared = true
    AND notes.share_token IS NOT NULL
  )
);

-- Policy pro čtení úkolů sdílených poznámek
CREATE POLICY "Veřejný přístup k úkolům sdílených poznámek"
ON note_tasks FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM notes
    WHERE notes.id = note_tasks.note_id
    AND notes.is_shared = true
    AND notes.share_token IS NOT NULL
  )
);

-- Policy pro čtení zákazníka u sdílené poznámky
CREATE POLICY "Veřejný přístup k zákazníkovi sdílené poznámky"
ON customers FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM notes
    WHERE notes.customer_id = customers.id
    AND notes.is_shared = true
    AND notes.share_token IS NOT NULL
  )
);
