import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import CS locales
import commonCS from './locales/cs/common.json'
import authCS from './locales/cs/auth.json'
import navigationCS from './locales/cs/navigation.json'
import customersCS from './locales/cs/customers.json'
import notesCS from './locales/cs/notes.json'
import tagsCS from './locales/cs/tags.json'
import calendarCS from './locales/cs/calendar.json'
import settingsCS from './locales/cs/settings.json'
import dashboardCS from './locales/cs/dashboard.json'
import auditCS from './locales/cs/audit.json'
import kanbanCS from './locales/cs/kanban.json'

// Import EN locales
import commonEN from './locales/en/common.json'
import authEN from './locales/en/auth.json'
import navigationEN from './locales/en/navigation.json'
import customersEN from './locales/en/customers.json'
import notesEN from './locales/en/notes.json'
import tagsEN from './locales/en/tags.json'
import calendarEN from './locales/en/calendar.json'
import settingsEN from './locales/en/settings.json'
import dashboardEN from './locales/en/dashboard.json'
import auditEN from './locales/en/audit.json'
import kanbanEN from './locales/en/kanban.json'

const resources = {
  cs: {
    common: commonCS,
    auth: authCS,
    navigation: navigationCS,
    customers: customersCS,
    notes: notesCS,
    tags: tagsCS,
    calendar: calendarCS,
    settings: settingsCS,
    dashboard: dashboardCS,
    audit: auditCS,
    kanban: kanbanCS,
  },
  en: {
    common: commonEN,
    auth: authEN,
    navigation: navigationEN,
    customers: customersEN,
    notes: notesEN,
    tags: tagsEN,
    calendar: calendarEN,
    settings: settingsEN,
    dashboard: dashboardEN,
    audit: auditEN,
    kanban: kanbanEN,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'cs',
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'navigation',
      'customers',
      'notes',
      'tags',
      'calendar',
      'settings',
      'dashboard',
      'audit',
      'kanban',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'bazina-tasker-language',
    },
  })

export default i18n
