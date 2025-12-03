import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { safeQuery } from '../lib/supabaseQuery'

export const useBulkActions = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Hromadná změna stavu poznámek
  const bulkUpdateStatus = useCallback(async (noteIds, status) => {
    if (noteIds.length === 0) return { error: null, count: 0 }

    setLoading(true)
    setError(null)

    const { error: updateError, count } = await safeQuery(() =>
      supabase
        .from('notes')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', noteIds)
    )

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return { error: updateError.message, count: 0 }
    }

    return { error: null, count: noteIds.length }
  }, [])

  // Hromadná změna priority poznámek
  const bulkUpdatePriority = useCallback(async (noteIds, priority) => {
    if (noteIds.length === 0) return { error: null, count: 0 }

    setLoading(true)
    setError(null)

    const { error: updateError } = await safeQuery(() =>
      supabase
        .from('notes')
        .update({ priority, updated_at: new Date().toISOString() })
        .in('id', noteIds)
    )

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return { error: updateError.message, count: 0 }
    }

    return { error: null, count: noteIds.length }
  }, [])

  // Hromadné smazání poznámek
  const bulkDelete = useCallback(async (noteIds) => {
    if (noteIds.length === 0) return { error: null, count: 0 }

    setLoading(true)
    setError(null)

    const { error: deleteError } = await safeQuery(() =>
      supabase
        .from('notes')
        .delete()
        .in('id', noteIds)
    )

    setLoading(false)

    if (deleteError) {
      setError(deleteError.message)
      return { error: deleteError.message, count: 0 }
    }

    return { error: null, count: noteIds.length }
  }, [])

  // Hromadné přidání tagu
  const bulkAddTag = useCallback(async (noteIds, tagId) => {
    if (noteIds.length === 0) return { error: null, count: 0 }

    setLoading(true)
    setError(null)

    // Nejprve zjistit, které poznámky už tento tag mají
    const { data: existingTags } = await safeQuery(() =>
      supabase
        .from('note_tags')
        .select('note_id')
        .in('note_id', noteIds)
        .eq('tag_id', tagId)
    )

    const existingNoteIds = (existingTags || []).map((t) => t.note_id)
    const newNoteIds = noteIds.filter((id) => !existingNoteIds.includes(id))

    if (newNoteIds.length === 0) {
      setLoading(false)
      return { error: null, count: 0 }
    }

    // Přidat tag k poznámkám, které ho ještě nemají
    const inserts = newNoteIds.map((noteId) => ({
      note_id: noteId,
      tag_id: tagId,
    }))

    const { error: insertError } = await safeQuery(() =>
      supabase.from('note_tags').insert(inserts)
    )

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return { error: insertError.message, count: 0 }
    }

    return { error: null, count: newNoteIds.length }
  }, [])

  return {
    loading,
    error,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkDelete,
    bulkAddTag,
  }
}
