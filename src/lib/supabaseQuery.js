/**
 * Wrapper pro Supabase dotazy s timeoutem
 * Řeší problém kdy Supabase klient interně neresolvuje Promise
 */

const DEFAULT_TIMEOUT = 10000 // 10 sekund

export const withTimeout = async (promise, timeoutMs = DEFAULT_TIMEOUT) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
  )

  return Promise.race([promise, timeoutPromise])
}

/**
 * Bezpečné provedení Supabase dotazu s timeoutem
 * @param {Function} queryFn - Funkce vracející Supabase query builder
 * @param {number} timeoutMs - Timeout v milisekundách
 * @returns {Promise<{data: any, error: any}>}
 */
export const safeQuery = async (queryFn, timeoutMs = DEFAULT_TIMEOUT) => {
  try {
    const result = await withTimeout(queryFn(), timeoutMs)
    return result
  } catch (err) {
    if (err.message === 'Query timeout') {
      console.error('Supabase query timeout')
      return { data: null, error: { message: 'Požadavek vypršel. Zkuste to znovu.' } }
    }
    return { data: null, error: { message: err.message } }
  }
}
