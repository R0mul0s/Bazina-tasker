import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export const useKanbanColumns = () => {
  const { user } = useAuth()
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all columns
  const fetchColumns = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('user_id', user.id)
      .order('order', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setColumns(data || [])
    }
    setLoading(false)
  }, [user])

  // Create new column
  const createColumn = async (name) => {
    if (!user) return { error: 'Not authenticated' }

    // Get max order
    const maxOrder = columns.length > 0
      ? Math.max(...columns.map(c => c.order)) + 1
      : 0

    const { data, error: createError } = await supabase
      .from('kanban_columns')
      .insert({
        user_id: user.id,
        name,
        order: maxOrder,
        is_default: false
      })
      .select()
      .single()

    if (createError) {
      return { error: createError.message }
    }

    setColumns([...columns, data])
    return { data }
  }

  // Update column
  const updateColumn = async (id, updates) => {
    const { data, error: updateError } = await supabase
      .from('kanban_columns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return { error: updateError.message }
    }

    setColumns(columns.map(c => c.id === id ? data : c))
    return { data }
  }

  // Delete column (notes will be moved to default by trigger)
  const deleteColumn = async (id) => {
    const column = columns.find(c => c.id === id)
    if (column?.is_default) {
      return { error: 'Cannot delete default column' }
    }

    const { error: deleteError } = await supabase
      .from('kanban_columns')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return { error: deleteError.message }
    }

    setColumns(columns.filter(c => c.id !== id))
    return { data: true }
  }

  // Reorder columns
  const reorderColumns = async (reorderedColumns) => {
    const updates = reorderedColumns.map((col, index) => ({
      id: col.id,
      user_id: user.id,
      name: col.name,
      order: index,
      is_default: col.is_default
    }))

    // Optimistic update
    setColumns(reorderedColumns.map((col, index) => ({ ...col, order: index })))

    const { error: updateError } = await supabase
      .from('kanban_columns')
      .upsert(updates)

    if (updateError) {
      // Revert on error
      await fetchColumns()
      return { error: updateError.message }
    }

    return { data: true }
  }

  // Get default column
  const getDefaultColumn = useCallback(() => {
    return columns.find(c => c.is_default) || columns[0]
  }, [columns])

  // Initial fetch
  useEffect(() => {
    fetchColumns()
  }, [fetchColumns])

  return {
    columns,
    loading,
    error,
    fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    getDefaultColumn
  }
}
