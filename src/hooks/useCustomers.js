import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { safeQuery } from '../lib/supabaseQuery'
import { getFromCache, setInCache, invalidateCache, CacheKeys, CacheTTL } from '../lib/cache'

export const useCustomers = () => {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  // Použít user?.id místo user objektu pro stabilní referenci
  const userId = user?.id

  // Načtení všech zákazníků s cachováním
  const fetchCustomers = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setCustomers([])
      setLoading(false)
      return
    }

    const cacheKey = CacheKeys.CUSTOMERS(userId)

    // Zkusit načíst z cache pokud není force refresh
    if (!forceRefresh) {
      const cachedData = getFromCache(cacheKey, CacheTTL.MEDIUM)
      if (cachedData) {
        setCustomers(cachedData)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)

    const { data, error: queryError } = await safeQuery(() =>
      supabase.from('customers').select('*').order('name', { ascending: true })
    )

    if (!isMountedRef.current) return

    if (queryError) {
      setError(queryError.message)
      setCustomers([])
    } else {
      setCustomers(data || [])
      // Uložit do cache
      setInCache(cacheKey, data || [])
    }

    setLoading(false)
  }, [userId])

  // Načtení jednoho zákazníka
  const fetchCustomer = useCallback(async (id) => {
    const { data, error: queryError } = await safeQuery(() =>
      supabase.from('customers').select('*').eq('id', id).single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    return { data, error: null }
  }, [])

  // Vytvoření zákazníka
  const createCustomer = useCallback(async (customerData) => {
    if (!userId) {
      return { data: null, error: 'Uživatel není přihlášen' }
    }

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('customers')
        .insert([{ ...customerData, user_id: userId }])
        .select()
        .single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    // Invalidovat cache
    invalidateCache(CacheKeys.CUSTOMERS(userId))

    if (isMountedRef.current) {
      setCustomers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    return { data, error: null }
  }, [userId])

  // Aktualizace zákazníka
  const updateCustomer = useCallback(async (id, customerData) => {
    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single()
    )

    if (queryError) {
      return { data: null, error: queryError.message }
    }

    // Invalidovat cache
    if (userId) invalidateCache(CacheKeys.CUSTOMERS(userId))

    if (isMountedRef.current) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? data : c)).sort((a, b) => a.name.localeCompare(b.name))
      )
    }
    return { data, error: null }
  }, [userId])

  // Smazání zákazníka
  const deleteCustomer = useCallback(async (id) => {
    const { error: queryError } = await safeQuery(() =>
      supabase.from('customers').delete().eq('id', id)
    )

    if (queryError) {
      return { error: queryError.message }
    }

    // Invalidovat cache
    if (userId) invalidateCache(CacheKeys.CUSTOMERS(userId))

    if (isMountedRef.current) {
      setCustomers((prev) => prev.filter((c) => c.id !== id))
    }
    return { error: null }
  }, [userId])

  // Vyhledávání zákazníků
  const searchCustomers = useCallback(async (query) => {
    if (!query.trim()) {
      return customers
    }

    const { data, error: queryError } = await safeQuery(() =>
      supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name', { ascending: true })
    )

    if (queryError) {
      return customers
    }

    return data || []
  }, [customers])

  // Hromadné vytvoření zákazníků (pro CSV import)
  const bulkCreateCustomers = useCallback(async (customersData) => {
    if (!userId) {
      return { data: null, error: 'Uživatel není přihlášen', imported: 0, failed: 0 }
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: [],
    }

    // Vložit zákazníky po dávkách (max 50 najednou)
    const batchSize = 50
    const batches = []
    for (let i = 0; i < customersData.length; i += batchSize) {
      batches.push(customersData.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const preparedData = batch.map((customer) => ({
        ...customer,
        user_id: userId,
      }))

      const { data, error: queryError } = await safeQuery(() =>
        supabase
          .from('customers')
          .insert(preparedData)
          .select()
      )

      if (queryError) {
        results.failed += batch.length
        results.errors.push(queryError.message)
      } else {
        results.imported += data?.length || 0
      }
    }

    // Invalidovat cache a refreshnout data
    invalidateCache(CacheKeys.CUSTOMERS(userId))
    await fetchCustomers(true)

    return {
      data: null,
      error: results.errors.length > 0 ? results.errors.join(', ') : null,
      imported: results.imported,
      failed: results.failed,
    }
  }, [userId, fetchCustomers])

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Načtení zákazníků při změně userId
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    bulkCreateCustomers,
  }
}
