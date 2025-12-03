import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ThemeContext = createContext()

const THEME_KEY = 'bazina-tasker-theme'

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth()
  const [theme, setThemeState] = useState(() => {
    // Načíst z localStorage při inicializaci
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) return saved
    // Fallback na systémové nastavení
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Aplikovat třídu na document
  useEffect(() => {
    document.documentElement.dataset.coreuiTheme = theme
    document.body.dataset.coreuiTheme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Načíst preferenci z profilu uživatele
  useEffect(() => {
    const loadUserPreference = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .single()

        if (data?.theme_preference) {
          setThemeState(data.theme_preference)
        }
      }
    }
    loadUserPreference()
  }, [user?.id])

  // Funkce pro změnu motivu
  const setTheme = async (newTheme) => {
    setThemeState(newTheme)

    // Uložit do profilu uživatele
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('id', user.id)
    }
  }

  // Toggle mezi light a dark
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
