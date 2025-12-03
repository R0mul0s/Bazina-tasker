import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { safeQuery } from '../lib/supabaseQuery'

export const useTaskReorder = () => {
  // Přeuspořádání úkolů v databázi
  const reorderTasks = useCallback(async (tasks) => {
    // Aktualizovat order pro všechny úkoly
    const updates = tasks.map((task, index) =>
      safeQuery(() =>
        supabase
          .from('note_tasks')
          .update({ order: index })
          .eq('id', task.id)
      )
    )

    const results = await Promise.all(updates)
    const hasError = results.some((r) => r.error)

    if (hasError) {
      return { error: 'Chyba při ukládání pořadí úkolů' }
    }

    return { error: null }
  }, [])

  return { reorderTasks }
}
