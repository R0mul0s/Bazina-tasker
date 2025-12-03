import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSun, cilMoon } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const Settings = () => {
  const { t, i18n } = useTranslation('settings')
  const { user, profile, updateProfile, updatePassword, updateLanguage } = useAuth()
  const { theme, setTheme } = useTheme()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Password change state
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    const { error } = await updateProfile({ full_name: fullName })

    setIsSaving(false)
    if (error) {
      setMessage({ type: 'danger', text: `${t('profile.error')} ${error}` })
    } else {
      setMessage({ type: 'success', text: t('profile.saved') })
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMessage({ type: '', text: '' })

    // Validace
    if (passwords.new.length < 6) {
      setPasswordMessage({ type: 'danger', text: t('password.tooShort') })
      return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMessage({ type: 'danger', text: t('password.noMatch') })
      return
    }

    setIsChangingPassword(true)

    const { error } = await updatePassword(passwords.new)

    setIsChangingPassword(false)
    if (error) {
      setPasswordMessage({ type: 'danger', text: `${t('password.error')} ${error.message}` })
    } else {
      setPasswordMessage({ type: 'success', text: t('password.success') })
      setPasswords({ new: '', confirm: '' })
    }
  }

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value
    await updateLanguage(newLang)
  }

  return (
    <>
      <h2 className="mb-4">{t('title')}</h2>

      <CRow>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>{t('profile.title')}</strong>
            </CCardHeader>
            <CCardBody>
              {message.text && (
                <CAlert color={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </CAlert>
              )}

              <CForm onSubmit={handleSaveProfile}>
                <div className="mb-3">
                  <CFormLabel htmlFor="email">{t('profile.email')}</CFormLabel>
                  <CFormInput
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                  />
                  <div className="form-text">{t('profile.emailHint')}</div>
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="fullName">{t('profile.fullName')}</CFormLabel>
                  <CFormInput
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('profile.fullNamePlaceholder')}
                  />
                </div>

                <CButton type="submit" color="primary" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      {t('profile.saving')}
                    </>
                  ) : (
                    t('profile.saveChanges')
                  )}
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>{t('appearance.title')}</strong>
            </CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <CFormLabel>{t('appearance.colorMode')}</CFormLabel>
                <div className="d-flex gap-2">
                  <CButton
                    color={theme === 'light' ? 'primary' : 'secondary'}
                    variant={theme === 'light' ? undefined : 'outline'}
                    onClick={() => setTheme('light')}
                    className="d-flex align-items-center gap-2"
                  >
                    <CIcon icon={cilSun} />
                    {t('appearance.light')}
                  </CButton>
                  <CButton
                    color={theme === 'dark' ? 'primary' : 'secondary'}
                    variant={theme === 'dark' ? undefined : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="d-flex align-items-center gap-2"
                  >
                    <CIcon icon={cilMoon} />
                    {t('appearance.dark')}
                  </CButton>
                </div>
                <div className="form-text mt-2">
                  {t('appearance.hint')}
                </div>
              </div>
            </CCardBody>
          </CCard>

          <CCard className="mb-4">
            <CCardHeader>
              <strong>{t('language.title')}</strong>
            </CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <CFormLabel htmlFor="language">{t('language.label')}</CFormLabel>
                <CFormSelect
                  id="language"
                  value={i18n.language}
                  onChange={handleLanguageChange}
                >
                  <option value="cs">{t('language.cs')}</option>
                  <option value="en">{t('language.en')}</option>
                </CFormSelect>
                <div className="form-text mt-2">
                  {t('language.hint')}
                </div>
              </div>
            </CCardBody>
          </CCard>

          <CCard className="mb-4">
            <CCardHeader>
              <strong>{t('password.title')}</strong>
            </CCardHeader>
            <CCardBody>
              {passwordMessage.text && (
                <CAlert
                  color={passwordMessage.type}
                  dismissible
                  onClose={() => setPasswordMessage({ type: '', text: '' })}
                >
                  {passwordMessage.text}
                </CAlert>
              )}

              <CForm onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <CFormLabel htmlFor="newPassword">{t('password.newPassword')}</CFormLabel>
                  <CFormInput
                    type="password"
                    id="newPassword"
                    placeholder={t('password.newPasswordPlaceholder')}
                    value={passwords.new}
                    onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                    minLength={6}
                    required
                  />
                  <div className="form-text">{t('password.minLength')}</div>
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="confirmPassword">{t('password.confirmPassword')}</CFormLabel>
                  <CFormInput
                    type="password"
                    id="confirmPassword"
                    placeholder={t('password.confirmPasswordPlaceholder')}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    required
                  />
                </div>

                <CButton type="submit" color="primary" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      {t('password.changing')}
                    </>
                  ) : (
                    t('password.change')
                  )}
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Settings
