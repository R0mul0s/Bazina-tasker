import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { safeQuery } from '../lib/supabaseQuery'

export const useTimeEntries = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Načtení záznamů pro poznámku
  const fetchTimeEntries = useCallback(async (noteId) => {
    if (!noteId) return { data: [], error: null }

    setLoading(true)
    setError(null)

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('note_time_entries')
        .select('*')
        .eq('note_id', noteId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
    )

    setLoading(false)

    if (queryError) {
      setError(queryError.message)
      return { data: [], error: queryError.message }
    }

    return { data: data || [], error: null }
  }, [])

  // Přidání nového záznamu
  const addTimeEntry = useCallback(async (noteId, durationMinutes, description = '', entryDate = null) => {
    if (!user?.id || !noteId) {
      return { data: null, error: 'Chybí uživatel nebo poznámka' }
    }

    if (!durationMinutes || durationMinutes <= 0) {
      return { data: null, error: 'Čas musí být větší než 0' }
    }

    setLoading(true)
    setError(null)

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('note_time_entries')
        .insert([{
          note_id: noteId,
          user_id: user.id,
          duration_minutes: durationMinutes,
          description: description || null,
          entry_date: entryDate || new Date().toISOString().split('T')[0],
        }])
        .select()
        .single()
    )

    setLoading(false)

    if (queryError) {
      setError(queryError.message)
      return { data: null, error: queryError.message }
    }

    return { data, error: null }
  }, [user?.id])

  // Smazání záznamu
  const deleteTimeEntry = useCallback(async (entryId) => {
    setLoading(true)
    setError(null)

    const { error: queryError } = await safeQuery(() =>
      supabase
        .from('note_time_entries')
        .delete()
        .eq('id', entryId)
    )

    setLoading(false)

    if (queryError) {
      setError(queryError.message)
      return { error: queryError.message }
    }

    return { error: null }
  }, [])

  // Celkový čas pro poznámku
  const getTotalTime = useCallback((entries) => {
    return entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0)
  }, [])

  // Formátování času
  const formatDuration = useCallback((minutes) => {
    if (!minutes || minutes <= 0) return '0 min'

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins} min`
    }
    if (mins === 0) {
      return `${hours} h`
    }
    return `${hours} h ${mins} min`
  }, [])

  // Parsování času z textu (např. "1h 30m", "90", "1.5h")
  const parseTimeInput = useCallback((input) => {
    if (!input) return 0

    const trimmed = input.trim().toLowerCase()

    // Čisté číslo = minuty
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10)
    }

    // Formát "1h 30m" nebo "1h30m"
    const hhmm = trimmed.match(/(\d+)\s*h\s*(\d+)?\s*m?/)
    if (hhmm) {
      const hours = parseInt(hhmm[1], 10) || 0
      const mins = parseInt(hhmm[2], 10) || 0
      return hours * 60 + mins
    }

    // Formát "1.5h" nebo "1,5h"
    const decimalHours = trimmed.match(/^(\d+[.,]\d+)\s*h$/)
    if (decimalHours) {
      const hours = parseFloat(decimalHours[1].replace(',', '.'))
      return Math.round(hours * 60)
    }

    // Formát "1h"
    const hoursOnly = trimmed.match(/^(\d+)\s*h$/)
    if (hoursOnly) {
      return parseInt(hoursOnly[1], 10) * 60
    }

    // Formát "30m" nebo "30min"
    const minsOnly = trimmed.match(/^(\d+)\s*m(in)?$/)
    if (minsOnly) {
      return parseInt(minsOnly[1], 10)
    }

    return 0
  }, [])

  return {
    loading,
    error,
    fetchTimeEntries,
    addTimeEntry,
    deleteTimeEntry,
    getTotalTime,
    formatDuration,
    parseTimeInput,
  }
}
