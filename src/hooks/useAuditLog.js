import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { safeQuery } from '../lib/supabaseQuery'

export const useAuditLog = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Načtení audit logu pro konkrétní záznam
  const fetchLogsForRecord = useCallback(async (tableName, recordId) => {
    if (!user) return { data: [], error: null }

    setLoading(true)
    setError(null)

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('audit_log')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
    )

    setLoading(false)

    if (queryError) {
      setError(queryError.message)
      return { data: [], error: queryError.message }
    }

    setLogs(data || [])
    return { data: data || [], error: null }
  }, [user])

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
    error,
    fetchLogsForRecord,
    fetchRecentChanges,
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
