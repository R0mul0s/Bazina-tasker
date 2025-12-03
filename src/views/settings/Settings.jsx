import { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSun, cilMoon } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const Settings = () => {
  const { user, profile, updateProfile, updatePassword } = useAuth()
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
      setMessage({ type: 'danger', text: `Chyba při ukládání: ${error}` })
    } else {
      setMessage({ type: 'success', text: 'Profil byl úspěšně uložen.' })
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMessage({ type: '', text: '' })

    // Validace
    if (passwords.new.length < 6) {
      setPasswordMessage({ type: 'danger', text: 'Nové heslo musí mít alespoň 6 znaků.' })
      return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMessage({ type: 'danger', text: 'Hesla se neshodují.' })
      return
    }

    setIsChangingPassword(true)

    const { error } = await updatePassword(passwords.new)

    setIsChangingPassword(false)
    if (error) {
      setPasswordMessage({ type: 'danger', text: `Chyba: ${error.message}` })
    } else {
      setPasswordMessage({ type: 'success', text: 'Heslo bylo úspěšně změněno.' })
      setPasswords({ new: '', confirm: '' })
    }
  }

  return (
    <>
      <h2 className="mb-4">Nastavení</h2>

      <CRow>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Profil</strong>
            </CCardHeader>
            <CCardBody>
              {message.text && (
                <CAlert color={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </CAlert>
              )}

              <CForm onSubmit={handleSaveProfile}>
                <div className="mb-3">
                  <CFormLabel htmlFor="email">Email</CFormLabel>
                  <CFormInput
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                  />
                  <div className="form-text">Email nelze změnit.</div>
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="fullName">Celé jméno</CFormLabel>
                  <CFormInput
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Zadejte své jméno"
                  />
                </div>

                <CButton type="submit" color="primary" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Ukládám...
                    </>
                  ) : (
                    'Uložit změny'
                  )}
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Vzhled aplikace</strong>
            </CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <CFormLabel>Barevný režim</CFormLabel>
                <div className="d-flex gap-2">
                  <CButton
                    color={theme === 'light' ? 'primary' : 'secondary'}
                    variant={theme === 'light' ? undefined : 'outline'}
                    onClick={() => setTheme('light')}
                    className="d-flex align-items-center gap-2"
                  >
                    <CIcon icon={cilSun} />
                    Světlý
                  </CButton>
                  <CButton
                    color={theme === 'dark' ? 'primary' : 'secondary'}
                    variant={theme === 'dark' ? undefined : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="d-flex align-items-center gap-2"
                  >
                    <CIcon icon={cilMoon} />
                    Tmavý
                  </CButton>
                </div>
                <div className="form-text mt-2">
                  Zvolte preferovaný barevný režim aplikace. Nastavení se automaticky ukládá.
                </div>
              </div>
            </CCardBody>
          </CCard>

          <CCard className="mb-4">
            <CCardHeader>
              <strong>Změna hesla</strong>
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
                  <CFormLabel htmlFor="newPassword">Nové heslo</CFormLabel>
                  <CFormInput
                    type="password"
                    id="newPassword"
                    placeholder="Zadejte nové heslo"
                    value={passwords.new}
                    onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                    minLength={6}
                    required
                  />
                  <div className="form-text">Minimálně 6 znaků.</div>
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="confirmPassword">Potvrdit nové heslo</CFormLabel>
                  <CFormInput
                    type="password"
                    id="confirmPassword"
                    placeholder="Potvrďte nové heslo"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    required
                  />
                </div>

                <CButton type="submit" color="primary" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Měním heslo...
                    </>
                  ) : (
                    'Změnit heslo'
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
