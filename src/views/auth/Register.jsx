import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
  CSpinner,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilGlobeAlt } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'

const Register = () => {
  const { t, i18n } = useTranslation('auth')
  const { user, signUp, signInWithGoogle, loading } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('bazina-tasker-language', lang)
  }

  // Pokud je uživatel přihlášen, redirect na dashboard
  if (user && !loading) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validace
    if (password !== confirmPassword) {
      setError(t('errors.passwordsNoMatch'))
      return
    }

    if (password.length < 6) {
      setError(t('errors.passwordTooShort'))
      return
    }

    setIsLoading(true)

    const { data, error } = await signUp(email, password, fullName)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else if (data?.user?.identities?.length === 0) {
      setError(t('register.userExists'))
      setIsLoading(false)
    } else {
      setSuccess(t('register.success'))
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="auth-page">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8} lg={6} xl={5}>
            {/* Language switcher */}
            <div className="d-flex justify-content-end mb-3">
              <CDropdown>
                <CDropdownToggle color="light" size="sm">
                  <CIcon icon={cilGlobeAlt} className="me-1" />
                  {i18n.language === 'cs' ? 'CZ' : 'EN'}
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem
                    onClick={() => handleLanguageChange('cs')}
                    active={i18n.language === 'cs'}
                  >
                    Čeština
                  </CDropdownItem>
                  <CDropdownItem
                    onClick={() => handleLanguageChange('en')}
                    active={i18n.language === 'en'}
                  >
                    English
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </div>

            <CCard className="auth-page__card">
              <CCardBody className="p-4">
                <div className="auth-page__logo">
                  <h1>{t('register.title')}</h1>
                  <p className="text-secondary">{t('register.subtitle')}</p>
                </div>

                {error && (
                  <CAlert color="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </CAlert>
                )}

                {success && (
                  <CAlert color="success">
                    {success}
                  </CAlert>
                )}

                <CForm onSubmit={handleSubmit}>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      placeholder={t('register.fullName')}
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      type="email"
                      placeholder={t('register.email')}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder={t('register.password')}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder={t('register.confirmPassword')}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <CButton
                    type="submit"
                    color="primary"
                    className="w-100 mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? <CSpinner size="sm" /> : t('register.submit')}
                  </CButton>
                </CForm>

                <div className="auth-page__divider">
                  <span>{t('login.or')}</span>
                </div>

                <CButton
                  color="light"
                  className="w-100 mb-3"
                  onClick={handleGoogleLogin}
                >
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('register.withGoogle')}
                </CButton>

                <div className="text-center">
                  <span className="text-secondary">{t('register.hasAccount')} </span>
                  <Link to="/login">{t('register.login')}</Link>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
