import { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CSpinner,
  CAlert,
  CRow,
  CCol,
} from '@coreui/react'

// Předdefinované barvy pro tagy (odpovídají SCSS třídám)
const TAG_COLORS = [
  { name: 'Modrá', value: 'blue', hex: '#3b82f6' },
  { name: 'Tyrkysová', value: 'cyan', hex: '#06b6d4' },
  { name: 'Fialová', value: 'violet', hex: '#8b5cf6' },
  { name: 'Zelená', value: 'green', hex: '#10b981' },
  { name: 'Šedá', value: 'gray', hex: '#6b7280' },
  { name: 'Jantarová', value: 'amber', hex: '#f59e0b' },
  { name: 'Červená', value: 'red', hex: '#ef4444' },
  { name: 'Modrozelená', value: 'teal', hex: '#14b8a6' },
  { name: 'Oranžová', value: 'orange', hex: '#f97316' },
  { name: 'Žlutá', value: 'yellow', hex: '#fbbf24' },
  { name: 'Růžová', value: 'pink', hex: '#ec4899' },
  { name: 'Indigo', value: 'indigo', hex: '#6366f1' },
  { name: 'Limetková', value: 'lime', hex: '#22c55e' },
  { name: 'Hnědá', value: 'stone', hex: '#78716c' },
]

const TagForm = ({ visible, onClose, onSave, tag = null }) => {
  const isEditing = !!tag

  const [formData, setFormData] = useState({
    name: '',
    color: 'blue',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Načtení dat při editaci
  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || '',
        color: tag.color || 'blue',
      })
    } else {
      setFormData({
        name: '',
        color: 'blue',
      })
    }
    setError('')
  }, [tag, visible])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleColorSelect = (color) => {
    setFormData((prev) => ({ ...prev, color }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Název tagu je povinný')
      return
    }

    setLoading(true)

    const result = await onSave(formData, tag?.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      onClose()
    }
  }

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>
          {isEditing ? 'Upravit tag' : 'Nový tag'}
        </CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError('')}>
              {error}
            </CAlert>
          )}

          <div className="mb-3">
            <CFormLabel htmlFor="name">Název tagu *</CFormLabel>
            <CFormInput
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="např. Důležité"
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Barva</CFormLabel>
            <CRow className="g-2">
              {TAG_COLORS.map((color) => (
                <CCol xs="auto" key={color.value}>
                  <button
                    type="button"
                    className={`tag-badge tag-badge--${color.value} ${
                      formData.color === color.value ? 'ring-selected' : ''
                    }`}
                    onClick={() => handleColorSelect(color.value)}
                    title={color.name}
                  />
                </CCol>
              ))}
            </CRow>
          </div>

          <div className="mb-3">
            <CFormLabel>Náhled</CFormLabel>
            <div>
              <span className={`tag-badge tag-badge--lg tag-badge--${formData.color}`}>
                {formData.name || 'Název tagu'}
              </span>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={loading}>
            Zrušit
          </CButton>
          <CButton type="submit" color="primary" disabled={loading}>
            {loading ? <CSpinner size="sm" /> : isEditing ? 'Uložit změny' : 'Vytvořit'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default TagForm
