-- Rozšíření audit logování pro přílohy a časové záznamy

-- Nejprve upravit CHECK constraint na audit_log tabulce pro povolení nových typů akcí
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check
  CHECK (action IN (
    'INSERT', 'UPDATE', 'DELETE',
    'attachment_added', 'attachment_removed',
    'task_added', 'task_removed',
    'time_entry_added', 'time_entry_removed'
  ));

-- Trigger pro attachments (přílohy k poznámkám)
DROP TRIGGER IF EXISTS audit_attachments ON attachments;
CREATE TRIGGER audit_attachments
  AFTER INSERT OR DELETE ON attachments
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Trigger pro note_time_entries
DROP TRIGGER IF EXISTS audit_note_time_entries ON note_time_entries;
CREATE TRIGGER audit_note_time_entries
  AFTER INSERT OR UPDATE OR DELETE ON note_time_entries
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Pro přílohy a time_entries potřebujeme také logovat do parent note
-- Vytvoříme speciální funkci pro logování změn na related records

CREATE OR REPLACE FUNCTION log_related_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  action_desc TEXT;
BEGIN
  -- Získat parent note_id
  IF TG_OP = 'DELETE' THEN
    parent_id := OLD.note_id;
  ELSE
    parent_id := NEW.note_id;
  END IF;

  -- Popis akce podle tabulky a operace
  IF TG_TABLE_NAME = 'attachments' THEN
    IF TG_OP = 'INSERT' THEN
      action_desc := 'attachment_added';
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
      VALUES ('notes', parent_id, action_desc, jsonb_build_object(
        'attachment_id', NEW.id,
        'file_name', NEW.filename,
        'file_type', NEW.file_type
      ), auth.uid());
    ELSIF TG_OP = 'DELETE' THEN
      action_desc := 'attachment_removed';
      INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
      VALUES ('notes', parent_id, action_desc, jsonb_build_object(
        'attachment_id', OLD.id,
        'file_name', OLD.filename,
        'file_type', OLD.file_type
      ), auth.uid());
    END IF;

  ELSIF TG_TABLE_NAME = 'note_tasks' THEN
    IF TG_OP = 'INSERT' THEN
      action_desc := 'task_added';
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
      VALUES ('notes', parent_id, action_desc, jsonb_build_object(
        'task_id', NEW.id,
        'task_text', NEW.text
      ), auth.uid());
    ELSIF TG_OP = 'DELETE' THEN
      action_desc := 'task_removed';
      INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
      VALUES ('notes', parent_id, action_desc, jsonb_build_object(
        'task_id', OLD.id,
        'task_text', OLD.text
      ), auth.uid());
    END IF;

  ELSIF TG_TABLE_NAME = 'note_time_entries' THEN
    IF TG_OP = 'INSERT' THEN
      action_desc := 'time_entry_added';
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
      VALUES ('notes', parent_id, action_desc, jsonb_build_object(
        'time_entry_id', NEW.id,
        'duration_minutes', NEW.duration_minutes,
        'description', NEW.description
      ), auth.uid());
    ELSIF TG_OP = 'DELETE' THEN
      action_desc := 'time_entry_removed';
      INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
      VALUES ('notes', parent_id, action_desc, jsonb_build_object(
        'time_entry_id', OLD.id,
        'duration_minutes', OLD.duration_minutes,
        'description', OLD.description
      ), auth.uid());
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggery pro logování změn do parent note

-- Přílohy -> poznámky
DROP TRIGGER IF EXISTS audit_attachments_to_note ON attachments;
CREATE TRIGGER audit_attachments_to_note
  AFTER INSERT OR DELETE ON attachments
  FOR EACH ROW EXECUTE FUNCTION log_related_audit_changes();

-- Úkoly -> poznámky (pouze INSERT a DELETE, ne UPDATE order)
DROP TRIGGER IF EXISTS audit_note_tasks_to_note ON note_tasks;
CREATE TRIGGER audit_note_tasks_to_note
  AFTER INSERT OR DELETE ON note_tasks
  FOR EACH ROW EXECUTE FUNCTION log_related_audit_changes();

-- Časové záznamy -> poznámky
DROP TRIGGER IF EXISTS audit_note_time_entries_to_note ON note_time_entries;
CREATE TRIGGER audit_note_time_entries_to_note
  AFTER INSERT OR DELETE ON note_time_entries
  FOR EACH ROW EXECUTE FUNCTION log_related_audit_changes();
