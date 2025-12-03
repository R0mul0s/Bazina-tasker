/**
 * Jednoduchý in-memory cache pro data z API
 * Pomáhá redukovat zbytečné dotazy na server
 */

const cache = new Map()
const cacheTimestamps = new Map()

// Výchozí TTL - 5 minut
const DEFAULT_TTL = 5 * 60 * 1000

/**
 * Získá hodnotu z cache pokud existuje a není expirovaná
 * @param {string} key - klíč v cache
 * @param {number} ttl - time-to-live v ms (default 5 minut)
 * @returns {any|null} - hodnota nebo null pokud neexistuje/expirovala
 */
export const getFromCache = (key, ttl = DEFAULT_TTL) => {
  const timestamp = cacheTimestamps.get(key)

  if (!timestamp) {
    return null
  }

  const now = Date.now()
  if (now - timestamp > ttl) {
    // Cache expirovala
    cache.delete(key)
    cacheTimestamps.delete(key)
    return null
  }

  return cache.get(key)
}

/**
 * Uloží hodnotu do cache
 * @param {string} key - klíč
 * @param {any} value - hodnota
 */
export const setInCache = (key, value) => {
  cache.set(key, value)
  cacheTimestamps.set(key, Date.now())
}

/**
 * Invaliduje konkrétní klíč v cache
 * @param {string} key - klíč k invalidaci
 */
export const invalidateCache = (key) => {
  cache.delete(key)
  cacheTimestamps.delete(key)
}

/**
 * Invaliduje všechny klíče začínající prefixem
 * @param {string} prefix - prefix klíčů k invalidaci
 */
export const invalidateCacheByPrefix = (prefix) => {
  const keysToDelete = []
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => {
    cache.delete(key)
    cacheTimestamps.delete(key)
  })
}

/**
 * Vyčistí celou cache
 */
export const clearCache = () => {
  cache.clear()
  cacheTimestamps.clear()
}

/**
 * Cache klíče pro jednotlivé entity
 */
export const CacheKeys = {
  CUSTOMERS: (userId) => `customers:${userId}`,
  CUSTOMER: (customerId) => `customer:${customerId}`,
  NOTES: (userId) => `notes:${userId}`,
  NOTE: (noteId) => `note:${noteId}`,
  TAGS: (userId) => `tags:${userId}`,
  DASHBOARD_STATS: (userId) => `dashboard:${userId}`,
}

/**
 * TTL hodnoty pro různé typy dat (v ms)
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minuta - pro často měnící se data
  MEDIUM: 5 * 60 * 1000,     // 5 minut - default
  LONG: 15 * 60 * 1000,      // 15 minut - pro méně měnící se data
  VERY_LONG: 60 * 60 * 1000, // 1 hodina - pro statická data
}

export default {
  getFromCache,
  setInCache,
  invalidateCache,
  invalidateCacheByPrefix,
  clearCache,
  CacheKeys,
  CacheTTL,
}
