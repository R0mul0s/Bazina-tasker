import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { safeQuery } from '../lib/supabaseQuery'

export const useNotes = (customerId = null) => {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  // Použít user?.id místo user objektu pro stabilní referenci
  const userId = user?.id

  // Transformace dat - flatten tags a spočítat celkový čas
  const transformNotes = useCallback((data) => {
    return (data || []).map((note) => {
      const timeEntries = note.time_entries || []
      const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0)
      return {
        ...note,
        tags: note.tags?.map((t) => t.tag) || [],
        tasks: note.tasks || [],
        time_entries: timeEntries,
        total_time_minutes: totalMinutes,
      }
    })
  }, [])

  // Načtení poznámek (volitelně filtrovaných podle zákazníka)
  const fetchNotes = useCallback(async (filters = {}) => {
    if (!userId) {
      setNotes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: queryError } = await safeQuery(() => {
      let query = supabase
        .from('notes')
        .select(`
          *,
          customer:customers(id, name, company),
          tags:note_tags(tag:tags(*)),
          tasks:note_tasks(*),
          time_entries:note_time_entries(id, duration_minutes)
        `)
        .order('created_at', { ascending: false })

      // Filtr podle zákazníka
      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      // Další filtry
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.meeting_type) {
        query = query.eq('meeting_type', filters.meeting_type)
      }

      return query
    })

    if (!isMountedRef.current) return

    if (queryError) {
      setError(queryError.message)
      setNotes([])
    } else {
      setNotes(transformNotes(data))
    }

    setLoading(false)
  }, [userId, customerId, transformNotes])

  // Načtení jedné poznámky
  const fetchNote = useCallback(async (id) => {
    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('notes')
        .select(`
          *,
          customer:customers(id, name, company),
          tags:note_tags(tag:tags(*)),
          tasks:note_tasks(*)
        `)
        .eq('id', id)
        .single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    // Transformace
    const transformedData = {
      ...data,
      tags: data.tags?.map((t) => t.tag) || [],
      tasks: data.tasks || [],
    }

    return { data: transformedData, error: null }
  }, [])

  // Vytvoření poznámky
  const createNote = useCallback(async (noteData, tagIds = []) => {
    if (!userId) {
      return { data: null, error: 'Uživatel není přihlášen' }
    }

    const { tags, tasks, ...noteFields } = noteData

    // Vytvoření poznámky
    const { data: note, error: noteError } = await safeQuery(() =>
      supabase
        .from('notes')
        .insert([{ ...noteFields, user_id: userId }])
        .select()
        .single()
    )

    if (noteError) {
      return { data: null, error: noteError.message }
    }

    // Přidání tagů
    if (tagIds.length > 0) {
      const tagInserts = tagIds.map((tagId) => ({
        note_id: note.id,
        tag_id: tagId,
      }))
      await safeQuery(() => supabase.from('note_tags').insert(tagInserts))
    }

    // Přidání úkolů
    if (tasks && tasks.length > 0) {
      const taskInserts = tasks.map((task, index) => ({
        note_id: note.id,
        text: task.text,
        is_completed: task.is_completed || false,
        order: index,
      }))
      await safeQuery(() => supabase.from('note_tasks').insert(taskInserts))
    }

    await fetchNotes()
    return { data: note, error: null }
  }, [userId, fetchNotes])

  // Aktualizace poznámky
  const updateNote = useCallback(async (id, noteData, tagIds = null) => {
    const { tags, tasks, customer, ...noteFields } = noteData

    // Aktualizace poznámky
    const { data: note, error: noteError } = await safeQuery(() =>
      supabase
        .from('notes')
        .update(noteFields)
        .eq('id', id)
        .select()
        .single()
    )

    if (noteError) {
      return { data: null, error: noteError.message }
    }

    // Aktualizace tagů (pokud byly předány)
    if (tagIds !== null) {
      // Smazat staré tagy
      await safeQuery(() => supabase.from('note_tags').delete().eq('note_id', id))

      // Přidat nové tagy
      if (tagIds.length > 0) {
        const tagInserts = tagIds.map((tagId) => ({
          note_id: id,
          tag_id: tagId,
        }))
        await safeQuery(() => supabase.from('note_tags').insert(tagInserts))
      }
    }

    // Aktualizace úkolů (pokud byly předány)
    if (tasks !== undefined) {
      // Smazat staré úkoly
      await safeQuery(() => supabase.from('note_tasks').delete().eq('note_id', id))

      // Přidat nové úkoly
      if (tasks && tasks.length > 0) {
        const taskInserts = tasks.map((task, index) => ({
          note_id: id,
          text: task.text,
          is_completed: task.is_completed || false,
          order: index,
        }))
        await safeQuery(() => supabase.from('note_tasks').insert(taskInserts))
      }
    }

    await fetchNotes()
    return { data: note, error: null }
  }, [fetchNotes])

  // Smazání poznámky
  const deleteNote = useCallback(async (id) => {
    const { error: queryError } = await safeQuery(() =>
      supabase.from('notes').delete().eq('id', id)
    )

    if (queryError) {
      return { error: queryError.message }
    }

    if (isMountedRef.current) {
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }
    return { error: null }
  }, [])

  // Aktualizace úkolu
  const updateTask = useCallback(async (taskId, isCompleted) => {
    const { error: queryError } = await safeQuery(() =>
      supabase
        .from('note_tasks')
        .update({ is_completed: isCompleted })
        .eq('id', taskId)
    )

    if (queryError) {
      return { error: queryError.message }
    }

    // Aktualizace lokálního stavu
    if (isMountedRef.current) {
      setNotes((prev) =>
        prev.map((note) => ({
          ...note,
          tasks: note.tasks.map((task) =>
            task.id === taskId ? { ...task, is_completed: isCompleted } : task
          ),
        }))
      )
    }

    return { error: null }
  }, [])

  // Získání poznámek vyžadujících akci
  const getRequiresAction = useCallback(() => {
    return notes.filter((n) => n.status === 'requires_action')
  }, [notes])

  // Získání nadcházejících follow-upů
  const getUpcomingFollowUps = useCallback((days = 7) => {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    return notes.filter((n) => {
      if (!n.follow_up_date) return false
      const followUp = new Date(n.follow_up_date)
      return followUp >= today && followUp <= futureDate
    })
  }, [notes])

  // Sdílení poznámky - vytvoření veřejného odkazu
  const shareNote = useCallback(async (noteId) => {
    const shareToken = crypto.randomUUID()

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('notes')
        .update({
          share_token: shareToken,
          is_shared: true,
          shared_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    return { data, error: null }
  }, [])

  // Zrušení sdílení poznámky
  const unshareNote = useCallback(async (noteId) => {
    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('notes')
        .update({
          share_token: null,
          is_shared: false,
          shared_at: null,
        })
        .eq('id', noteId)
        .select()
        .single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    return { data, error: null }
  }, [])

  // Kanban - načtení poznámek pro kanban board
  const fetchKanbanNotes = useCallback(async () => {
    if (!userId) return { data: [], error: null }

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('notes')
        .select(`
          id,
          title,
          status,
          priority,
          meeting_date,
          kanban_column_id,
          kanban_order,
          customer:customers(id, name, company),
          tags:note_tags(tag:tags(id, name, color)),
          tasks:note_tasks(id, is_completed)
        `)
        .eq('show_in_kanban', true)
        .order('kanban_order', { ascending: true })
    )

    if (queryError) {
      return { data: [], error: queryError.message }
    }

    // Transformace
    const transformedData = (data || []).map(note => ({
      ...note,
      tags: note.tags?.map((t) => t.tag) || [],
      tasks: note.tasks || [],
      tasks_completed: note.tasks?.filter(t => t.is_completed).length || 0,
      tasks_total: note.tasks?.length || 0,
    }))

    return { data: transformedData, error: null }
  }, [userId])

  // Kanban - aktualizace pozice poznámky
  const updateNoteKanbanPosition = useCallback(async (noteId, columnId, order) => {
    const { error: queryError } = await safeQuery(() =>
      supabase
        .from('notes')
        .update({
          kanban_column_id: columnId,
          kanban_order: order,
        })
        .eq('id', noteId)
    )

    if (queryError) {
      return { error: queryError.message }
    }

    return { error: null }
  }, [])

  // Kanban - hromadná aktualizace pořadí poznámek
  const updateKanbanOrder = useCallback(async (updates) => {
    // updates = [{ id, kanban_column_id, kanban_order }, ...]
    const promises = updates.map(update =>
      supabase
        .from('notes')
        .update({
          kanban_column_id: update.kanban_column_id,
          kanban_order: update.kanban_order,
        })
        .eq('id', update.id)
    )

    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      return { error: errors[0].error.message }
    }

    return { error: null }
  }, [])

  // Kanban - přidat/odebrat poznámku z kanbanu
  const toggleNoteKanban = useCallback(async (noteId, showInKanban, defaultColumnId = null) => {
    const updates = {
      show_in_kanban: showInKanban,
    }

    // Pokud přidáváme do kanbanu, nastavit výchozí sloupec
    if (showInKanban && defaultColumnId) {
      updates.kanban_column_id = defaultColumnId
      updates.kanban_order = 0
    }

    // Pokud odebíráme z kanbanu, vynulovat kanban pole
    if (!showInKanban) {
      updates.kanban_column_id = null
      updates.kanban_order = 0
    }

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('notes')
        .update(updates)
        .eq('id', noteId)
        .select()
        .single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    return { data, error: null }
  }, [])

  // Duplikování poznámky
  const duplicateNote = useCallback(async (noteId) => {
    if (!userId) {
      return { data: null, error: 'Uživatel není přihlášen' }
    }

    // Načíst původní poznámku se všemi daty
    const { data: originalNote, error: fetchError } = await fetchNote(noteId)

    if (fetchError || !originalNote) {
      return { data: null, error: fetchError || 'Poznámka nenalezena' }
    }

    // Připravit data pro novou poznámku
    const today = new Date().toISOString().split('T')[0]
    const newNoteData = {
      title: `${originalNote.title} (kopie)`,
      content: originalNote.content,
      customer_id: originalNote.customer_id,
      meeting_date: today,
      meeting_type: originalNote.meeting_type,
      status: 'draft',
      priority: originalNote.priority,
      follow_up_date: null,
    }

    // Vytvořit novou poznámku
    const { data: newNote, error: createError } = await safeQuery(() =>
      supabase
        .from('notes')
        .insert([{ ...newNoteData, user_id: userId }])
        .select()
        .single()
    )

    if (createError) {
      return { data: null, error: createError.message }
    }

    // Zkopírovat tagy
    if (originalNote.tags && originalNote.tags.length > 0) {
      const tagInserts = originalNote.tags.map((tag) => ({
        note_id: newNote.id,
        tag_id: tag.id,
      }))
      await safeQuery(() => supabase.from('note_tags').insert(tagInserts))
    }

    // Zkopírovat úkoly (bez dokončení)
    if (originalNote.tasks && originalNote.tasks.length > 0) {
      const taskInserts = originalNote.tasks.map((task, index) => ({
        note_id: newNote.id,
        text: task.text,
        is_completed: false,
        order: index,
      }))
      await safeQuery(() => supabase.from('note_tasks').insert(taskInserts))
    }

    await fetchNotes()
    return { data: newNote, error: null }
  }, [userId, fetchNote, fetchNotes])

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Načtení poznámek při změně userId nebo customerId
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    loading,
    error,
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    deleteNote,
    updateTask,
    duplicateNote,
    shareNote,
    unshareNote,
    getRequiresAction,
    getUpcomingFollowUps,
    // Kanban
    fetchKanbanNotes,
    updateNoteKanbanPosition,
    updateKanbanOrder,
    toggleNoteKanban,
  }
}

// Samostatná funkce pro načtení sdílené poznámky (bez autentizace)
export const fetchSharedNote = async (shareToken) => {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      id,
      title,
      content,
      meeting_date,
      meeting_type,
      status,
      priority,
      created_at,
      shared_at,
      customer:customers(id, name, company),
      tags:note_tags(tag:tags(id, name, color)),
      tasks:note_tasks(id, text, is_completed, order)
    `)
    .eq('share_token', shareToken)
    .eq('is_shared', true)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Transformace
  const transformedData = {
    ...data,
    tags: data.tags?.map((t) => t.tag) || [],
    tasks: (data.tasks || []).sort((a, b) => a.order - b.order),
  }

  return { data: transformedData, error: null }
}
