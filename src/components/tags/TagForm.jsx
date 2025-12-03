import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  'blue', 'cyan', 'violet', 'green', 'gray', 'amber', 'red',
  'teal', 'orange', 'yellow', 'pink', 'indigo', 'lime', 'stone'
]

const TagForm = ({ visible, onClose, onSave, tag = null }) => {
  const { t } = useTranslation('tags')
  const { t: tCommon } = useTranslation('common')
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
      setError(t('form.nameRequired'))
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
          {isEditing ? t('form.titleEdit') : t('form.titleNew')}
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
            <CFormLabel htmlFor="name">{t('form.name')} *</CFormLabel>
            <CFormInput
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('form.namePlaceholder')}
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>{t('form.color')}</CFormLabel>
            <CRow className="g-2">
              {TAG_COLORS.map((color) => (
                <CCol xs="auto" key={color}>
                  <button
                    type="button"
                    className={`tag-badge tag-badge--${color} ${
                      formData.color === color ? 'ring-selected' : ''
                    }`}
                    onClick={() => handleColorSelect(color)}
                    title={t(`colors.${color}`)}
                  />
                </CCol>
              ))}
            </CRow>
          </div>

          <div className="mb-3">
            <CFormLabel>{t('form.preview')}</CFormLabel>
            <div>
              <span className={`tag-badge tag-badge--lg tag-badge--${formData.color}`}>
                {formData.name || t('form.tagNamePlaceholder')}
              </span>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={loading}>
            {tCommon('actions.cancel')}
          </CButton>
          <CButton type="submit" color="primary" disabled={loading}>
            {loading ? <CSpinner size="sm" /> : isEditing ? t('form.saveChanges') : tCommon('actions.create')}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default TagForm
