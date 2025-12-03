-- Audit log tabulka
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pro rychlejší dotazy
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- RLS politiky
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Uživatel vidí audit log pouze pro své záznamy
CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Funkce pro automatické logování změn
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_cols TEXT[];
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Získat ID uživatele z auth.uid()

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Najít změněné sloupce
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);

    SELECT array_agg(key)
    INTO changed_cols
    FROM (
      SELECT key
      FROM jsonb_each(old_data)
      WHERE NOT (new_data ? key AND new_data->key = old_data->key)
      UNION
      SELECT key
      FROM jsonb_each(new_data)
      WHERE NOT (old_data ? key AND old_data->key = new_data->key)
    ) AS changed_keys;

    -- Logovat pouze pokud se něco změnilo (kromě updated_at)
    IF changed_cols IS NOT NULL AND array_length(changed_cols, 1) > 0 THEN
      -- Odfiltrovat updated_at pokud je jediná změna
      changed_cols := array_remove(changed_cols, 'updated_at');

      IF array_length(changed_cols, 1) > 0 THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_fields, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', old_data, new_data, changed_cols, auth.uid());
      END IF;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggery pro jednotlivé tabulky

-- Notes
DROP TRIGGER IF EXISTS audit_notes ON notes;
CREATE TRIGGER audit_notes
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Customers
DROP TRIGGER IF EXISTS audit_customers ON customers;
CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Tags
DROP TRIGGER IF EXISTS audit_tags ON tags;
CREATE TRIGGER audit_tags
  AFTER INSERT OR UPDATE OR DELETE ON tags
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Note tasks
DROP TRIGGER IF EXISTS audit_note_tasks ON note_tasks;
CREATE TRIGGER audit_note_tasks
  AFTER INSERT OR UPDATE OR DELETE ON note_tasks
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
