-- Přidání hodnoty 'archived' do enum note_status
ALTER TYPE note_status ADD VALUE IF NOT EXISTS 'archived';

COMMENT ON TYPE note_status IS 'Stav poznámky: draft (koncept), completed (dokončeno), requires_action (vyžaduje akci), archived (archivováno)';
