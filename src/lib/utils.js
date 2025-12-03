import { format, formatDistanceToNow } from 'date-fns'
import { cs, enUS } from 'date-fns/locale'

// Mapování jazyků na locale
const locales = {
  cs: cs,
  en: enUS,
}

// Získání aktuálního locale z localStorage nebo výchozí cs
const getCurrentLocale = () => {
  const lang = localStorage.getItem('i18nextLng') || 'cs'
  return locales[lang] || cs
}

/**
 * Formátování data
 * @param {Date|string} date
 * @param {string} formatStr
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'd. M. yyyy') => {
  if (!date) return ''
  return format(new Date(date), formatStr, { locale: getCurrentLocale() })
}

/**
 * Formátování data s časem
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'd. M. yyyy HH:mm', { locale: getCurrentLocale() })
}

/**
 * Relativní čas (např. "před 2 hodinami" / "2 hours ago")
 * @param {Date|string} date
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: getCurrentLocale() })
}

/**
 * Zkrácení textu
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Formátování velikosti souboru
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Generování iniciál z jména
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Klasické spojení className
 * @param  {...string} classes
 * @returns {string}
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Formátování minut na hodiny a minuty
 * @param {number} minutes
 * @returns {string}
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0h'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
