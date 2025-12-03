-- Kanban columns table
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_kanban_columns_user ON kanban_columns(user_id);

-- RLS policies
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kanban columns"
  ON kanban_columns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own kanban columns"
  ON kanban_columns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own kanban columns"
  ON kanban_columns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own kanban columns"
  ON kanban_columns FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_default = false);

-- Add kanban fields to notes table
ALTER TABLE notes
  ADD COLUMN show_in_kanban BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN kanban_column_id UUID REFERENCES kanban_columns(id) ON DELETE SET NULL,
  ADD COLUMN kanban_order INTEGER NOT NULL DEFAULT 0;

-- Index for kanban queries
CREATE INDEX idx_notes_kanban ON notes(user_id, show_in_kanban, kanban_column_id);

-- Function to create default kanban column for new users
CREATE OR REPLACE FUNCTION create_default_kanban_column()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kanban_columns (user_id, name, "order", is_default)
  VALUES (NEW.id, 'Backlog', 0, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default column when user profile is created
CREATE TRIGGER on_profile_created_kanban
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_kanban_column();

-- Create default columns for existing users
INSERT INTO kanban_columns (user_id, name, "order", is_default)
SELECT id, 'Backlog', 0, true
FROM profiles
WHERE id NOT IN (SELECT DISTINCT user_id FROM kanban_columns);

-- Function to handle column deletion - move notes to default column
CREATE OR REPLACE FUNCTION handle_kanban_column_delete()
RETURNS TRIGGER AS $$
DECLARE
  default_column_id UUID;
BEGIN
  -- Find user's default column
  SELECT id INTO default_column_id
  FROM kanban_columns
  WHERE user_id = OLD.user_id AND is_default = true
  LIMIT 1;

  -- Move notes from deleted column to default column
  IF default_column_id IS NOT NULL THEN
    UPDATE notes
    SET kanban_column_id = default_column_id
    WHERE kanban_column_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for column deletion
CREATE TRIGGER before_kanban_column_delete
  BEFORE DELETE ON kanban_columns
  FOR EACH ROW
  EXECUTE FUNCTION handle_kanban_column_delete();

-- Ensure only one default column per user
CREATE OR REPLACE FUNCTION ensure_single_default_column()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE kanban_columns
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_kanban_column_default_change
  AFTER INSERT OR UPDATE OF is_default ON kanban_columns
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_column();
