import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { safeQuery } from '../lib/supabaseQuery'

const DEFAULT_PAGE_SIZE = 5

export const useAuditLog = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const currentParamsRef = useRef({ tableName: null, recordId: null })

  // Načtení audit logu pro konkrétní záznam s stránkováním
  const fetchLogsForRecord = useCallback(async (tableName, recordId, pageSize = DEFAULT_PAGE_SIZE) => {
    if (!user) return { data: [], error: null }

    setLoading(true)
    setError(null)
    currentParamsRef.current = { tableName, recordId }

    // Nejprve získat celkový počet
    const { count } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('table_name', tableName)
      .eq('record_id', recordId)

    setTotalCount(count || 0)

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('audit_log')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1)
    )

    setLoading(false)

    if (queryError) {
      setError(queryError.message)
      return { data: [], error: queryError.message }
    }

    const resultData = data || []
    setLogs(resultData)
    setHasMore(resultData.length < (count || 0))
    return { data: resultData, error: null }
  }, [user])

  // Načtení dalších záznamů
  const loadMore = useCallback(async (pageSize = DEFAULT_PAGE_SIZE) => {
    const { tableName, recordId } = currentParamsRef.current
    if (!user || !tableName || !recordId || loadingMore) return

    setLoadingMore(true)

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('audit_log')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
        .range(logs.length, logs.length + pageSize - 1)
    )

    setLoadingMore(false)

    if (queryError) {
      setError(queryError.message)
      return
    }

    const newData = data || []
    setLogs(prev => [...prev, ...newData])
    setHasMore(logs.length + newData.length < totalCount)
  }, [user, logs.length, totalCount, loadingMore])

  // Načtení posledních změn (pro dashboard)
  const fetchRecentChanges = useCallback(async (limit = 20) => {
    if (!user) return { data: [], error: null }

    setLoading(true)
    setError(null)

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    )

    setLoading(false)

    if (queryError) {
      setError(queryError.message)
      return { data: [], error: queryError.message }
    }

    setLogs(data || [])
    return { data: data || [], error: null }
  }, [user])

  // Formátování změněných polí pro zobrazení
  const formatChanges = useCallback((log) => {
    if (!log.changed_fields || log.action !== 'UPDATE') return []

    return log.changed_fields.map((field) => {
      const oldValue = log.old_values?.[field]
      const newValue = log.new_values?.[field]

      return {
        field,
        oldValue: formatValue(oldValue),
        newValue: formatValue(newValue),
      }
    })
  }, [])

  return {
    logs,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    fetchLogsForRecord,
    fetchRecentChanges,
    loadMore,
    formatChanges,
  }
}

// Pomocná funkce pro formátování hodnot
const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Ano' : 'Ne'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...'
  }
  return String(value)
}

// Překlad názvů tabulek
export const tableNameLabels = {
  notes: 'Poznámka',
  customers: 'Zákazník',
  tags: 'Tag',
  note_tasks: 'Úkol',
}

// Překlad akcí
export const actionLabels = {
  INSERT: 'Vytvořeno',
  UPDATE: 'Upraveno',
  DELETE: 'Smazáno',
  attachment_added: 'Příloha přidána',
  attachment_removed: 'Příloha odebrána',
  task_added: 'Úkol přidán',
  task_removed: 'Úkol odebrán',
  time_entry_added: 'Čas přidán',
  time_entry_removed: 'Čas odebrán',
}

// Překlad názvů polí
export const fieldLabels = {
  title: 'Název',
  content: 'Obsah',
  status: 'Stav',
  priority: 'Priorita',
  meeting_type: 'Typ schůzky',
  meeting_date: 'Datum schůzky',
  follow_up_date: 'Follow-up',
  name: 'Jméno',
  company: 'Firma',
  email: 'Email',
  phone: 'Telefon',
  address: 'Adresa',
  notes: 'Poznámky',
  text: 'Text',
  is_completed: 'Dokončeno',
  order: 'Pořadí',
  color: 'Barva',
}
