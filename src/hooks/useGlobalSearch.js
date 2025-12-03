import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export const useGlobalSearch = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({
    customers: [],
    notes: [],
    tags: [],
  })

  const search = useCallback(
    async (query) => {
      if (!query || query.length < 2 || !user) {
        setResults({ customers: [], notes: [], tags: [] })
        return
      }

      setLoading(true)

      try {
        const searchTerm = `%${query}%`

        // Paralelní vyhledávání ve všech tabulkách
        const [customersRes, notesRes, tagsRes] = await Promise.all([
          // Zákazníci
          supabase
            .from('customers')
            .select('id, name, email, company')
            .eq('user_id', user.id)
            .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`)
            .limit(5),

          // Poznámky
          supabase
            .from('notes')
            .select(`
              id,
              title,
              content,
              customer:customers(id, name)
            `)
            .eq('user_id', user.id)
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(5),

          // Tagy
          supabase
            .from('tags')
            .select('id, name, color')
            .eq('user_id', user.id)
            .ilike('name', searchTerm)
            .limit(5),
        ])

        setResults({
          customers: customersRes.data || [],
          notes: notesRes.data || [],
          tags: tagsRes.data || [],
        })
      } catch (error) {
        console.error('Search error:', error)
        setResults({ customers: [], notes: [], tags: [] })
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  const clearResults = useCallback(() => {
    setResults({ customers: [], notes: [], tags: [] })
  }, [])

  const hasResults =
    results.customers.length > 0 ||
    results.notes.length > 0 ||
    results.tags.length > 0

  const totalResults =
    results.customers.length + results.notes.length + results.tags.length

  return {
    loading,
    results,
    search,
    clearResults,
    hasResults,
    totalResults,
  }
}
