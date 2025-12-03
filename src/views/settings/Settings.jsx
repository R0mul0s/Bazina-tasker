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
  CFormCheck,
  CButtonGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSun, cilMoon, cilContrast } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const Settings = () => {
  const { user, profile } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    // TODO: Implementovat ukládání profilu
    setTimeout(() => {
      setIsSaving(false)
      setMessage({
        type: 'info',
        text: 'Ukládání profilu bude implementováno v další fázi.',
      })
    }, 500)
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
                  {isSaving ? 'Ukládám...' : 'Uložit změny'}
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
              <CForm>
                <div className="mb-3">
                  <CFormLabel htmlFor="currentPassword">Aktuální heslo</CFormLabel>
                  <CFormInput
                    type="password"
                    id="currentPassword"
                    placeholder="Zadejte aktuální heslo"
                  />
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="newPassword">Nové heslo</CFormLabel>
                  <CFormInput
                    type="password"
                    id="newPassword"
                    placeholder="Zadejte nové heslo"
                  />
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="confirmPassword">Potvrdit nové heslo</CFormLabel>
                  <CFormInput
                    type="password"
                    id="confirmPassword"
                    placeholder="Potvrďte nové heslo"
                  />
                </div>

                <CButton type="submit" color="primary">
                  Změnit heslo
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
