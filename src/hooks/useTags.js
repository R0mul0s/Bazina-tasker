import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { safeQuery } from '../lib/supabaseQuery'

export const useTags = () => {
  const { user } = useAuth()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  // Použít user?.id místo user objektu pro stabilní referenci
  const userId = user?.id

  // Načtení všech tagů
  const fetchTags = useCallback(async () => {
    if (!userId) {
      setTags([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: queryError } = await safeQuery(() =>
      supabase.from('tags').select('*').order('name', { ascending: true })
    )

    if (!isMountedRef.current) return

    if (queryError) {
      setError(queryError.message)
      setTags([])
    } else {
      setTags(data || [])
    }

    setLoading(false)
  }, [userId])

  // Vytvoření tagu
  const createTag = useCallback(async (tagData) => {
    if (!userId) {
      return { data: null, error: 'Uživatel není přihlášen' }
    }

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('tags')
        .insert([{ ...tagData, user_id: userId }])
        .select()
        .single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    if (isMountedRef.current) {
      setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    return { data, error: null }
  }, [userId])

  // Aktualizace tagu
  const updateTag = useCallback(async (id, tagData) => {
    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('tags')
        .update(tagData)
        .eq('id', id)
        .select()
        .single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    if (isMountedRef.current) {
      setTags((prev) =>
        prev.map((t) => (t.id === id ? data : t)).sort((a, b) => a.name.localeCompare(b.name))
      )
    }
    return { data, error: null }
  }, [])

  // Smazání tagu
  const deleteTag = useCallback(async (id) => {
    const { error: queryError } = await safeQuery(() =>
      supabase.from('tags').delete().eq('id', id)
    )

    if (queryError) {
      return { error: queryError.message }
    }

    if (isMountedRef.current) {
      setTags((prev) => prev.filter((t) => t.id !== id))
    }
    return { error: null }
  }, [])

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Načtení tagů při změně userId
  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  }
}
