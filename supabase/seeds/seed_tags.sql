-- Seed script pro vytvoření výchozích tagů
-- DŮLEŽITÉ: Nahraďte 'YOUR_USER_ID' vaším skutečným user ID z tabulky auth.users
-- User ID najdete v Supabase Dashboard -> Authentication -> Users

-- Nejprve získejte své user_id a nahraďte ho níže
-- Nebo spusťte tento dotaz pro zjištění vašeho ID:
-- SELECT id, email FROM auth.users;

DO $$
DECLARE
    v_user_id UUID := 'YOUR_USER_ID'; -- <-- NAHRAĎTE TÍMTO VAŠÍM USER ID
BEGIN
    -- Obchodní fáze (modré/zelené odstíny)
    INSERT INTO public.tags (user_id, name, color) VALUES
        (v_user_id, 'Nový kontakt', '#3B82F6'),      -- modrá
        (v_user_id, 'Nabídka', '#06B6D4'),           -- cyan
        (v_user_id, 'Jednání', '#8B5CF6'),           -- fialová
        (v_user_id, 'Zakázka', '#10B981'),           -- zelená
        (v_user_id, 'Ztraceno', '#6B7280')           -- šedá
    ON CONFLICT DO NOTHING;

    -- Typ interakce (oranžové/žluté odstíny)
    INSERT INTO public.tags (user_id, name, color) VALUES
        (v_user_id, 'Follow-up', '#F59E0B'),         -- amber
        (v_user_id, 'Reklamace', '#EF4444'),         -- červená
        (v_user_id, 'Podpora', '#14B8A6'),           -- teal
        (v_user_id, 'Fakturace', '#F97316')          -- oranžová
    ON CONFLICT DO NOTHING;

    -- Stav akce (červené/růžové odstíny)
    INSERT INTO public.tags (user_id, name, color) VALUES
        (v_user_id, 'Čekám na odpověď', '#FBBF24'),  -- žlutá
        (v_user_id, 'Urgentní', '#DC2626'),          -- tmavě červená
        (v_user_id, 'VIP', '#EC4899')                -- růžová
    ON CONFLICT DO NOTHING;

    -- Kategorie (fialové/šedé odstíny)
    INSERT INTO public.tags (user_id, name, color) VALUES
        (v_user_id, 'Technické', '#6366F1'),         -- indigo
        (v_user_id, 'Obchodní', '#22C55E'),          -- lime
        (v_user_id, 'Právní', '#78716C')             -- stone
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Tagy byly úspěšně vytvořeny pro uživatele %', v_user_id;
END $$;
