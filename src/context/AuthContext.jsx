import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { safeQuery } from '../lib/supabaseQuery'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const isMountedRef = useRef(true)

  // Fetch profile s timeout ochranou
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null

    const { data, error } = await safeQuery(
      () => supabase.from('profiles').select('*').eq('id', userId).single(),
      5000
    )

    if (!error && data && isMountedRef.current) {
      setProfile(data)
      // Nastavit jazyk z profilu
      if (data.language && data.language !== i18n.language) {
        i18n.changeLanguage(data.language)
      }
      return data
    }
    return null
  }, [i18n])

  useEffect(() => {
    isMountedRef.current = true

    // Inicializace auth stavu
    const initAuth = async () => {
      try {
        // Timeout pro getSession - 15 sekund pro pomalé připojení
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 15000)
        )

        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise,
        ])

        if (!isMountedRef.current) return

        if (error) {
          console.error('Auth session error:', error)
          setUser(null)
          setProfile(null)
        } else if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Failed to get session:', err)
        if (isMountedRef.current) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    // Listener na změny auth stavu - MUSÍ být nastaven PŘED getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return

        // Ignorovat INITIAL_SESSION - to řešíme v initAuth
        if (event === 'INITIAL_SESSION') return

        console.log('Auth state change:', event)

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }

        setLoading(false)
      }
    )

    initAuth()

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          language: i18n.language, // Uložit aktuální jazyk při registraci
        },
      },
    })
    return { data, error }
  }

  const signInWithGoogle = async (redirectPath = '/') => {
    // Uložit cílovou cestu do sessionStorage pro použití po návratu z OAuth
    if (redirectPath && redirectPath !== '/') {
      sessionStorage.setItem('authRedirectPath', redirectPath)
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Aktualizace profilu
  const updateProfile = async (profileData) => {
    if (!user) {
      return { data: null, error: 'Uživatel není přihlášen' }
    }

    const { data, error } = await safeQuery(
      () => supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single(),
      5000
    )

    if (!error && data && isMountedRef.current) {
      setProfile(data)
    }

    return { data, error }
  }

  // Změna hesla
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  // Změna jazyka
  const updateLanguage = async (language) => {
    // Změnit jazyk v i18n
    i18n.changeLanguage(language)
    // Uložit do localStorage pro persistenci
    localStorage.setItem('bazina-tasker-language', language)

    // Uložit do profilu pokud je uživatel přihlášen
    if (user) {
      const { data, error } = await updateProfile({ language })
      return { data, error }
    }
    return { data: null, error: null }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    fetchProfile,
    updateProfile,
    updatePassword,
    updateLanguage,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
