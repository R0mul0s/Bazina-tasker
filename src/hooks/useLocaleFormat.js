import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { format, formatDistanceToNow } from 'date-fns'
import { cs, enUS } from 'date-fns/locale'

const locales = {
  cs: cs,
  en: enUS,
}

/**
 * Hook pro lokalizované formátování dat
 * Používá aktuální jazyk z i18n
 */
export const useLocaleFormat = () => {
  const { i18n } = useTranslation()
  const currentLocale = locales[i18n.language] || cs

  const formatDate = useCallback((date, formatStr = 'd. M. yyyy') => {
    if (!date) return ''
    return format(new Date(date), formatStr, { locale: currentLocale })
  }, [currentLocale])

  const formatDateTime = useCallback((date) => {
    if (!date) return ''
    return format(new Date(date), 'd. M. yyyy HH:mm', { locale: currentLocale })
  }, [currentLocale])

  const formatRelativeTime = useCallback((date) => {
    if (!date) return ''
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: currentLocale })
  }, [currentLocale])

  return {
    formatDate,
    formatDateTime,
    formatRelativeTime,
  }
}

export default useLocaleFormat
