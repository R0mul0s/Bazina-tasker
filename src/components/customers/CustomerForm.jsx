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
  CFormTextarea,
  CFormLabel,
  CRow,
  CCol,
  CSpinner,
  CAlert,
} from '@coreui/react'

const CustomerForm = ({ visible, onClose, onSave, customer = null }) => {
  const { t } = useTranslation('customers')
  const { t: tCommon } = useTranslation('common')
  const isEditing = !!customer

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Načtení dat při editaci
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        company: customer.company || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
      })
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      })
    }
    setError('')
  }, [customer, visible])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError(t('form.nameRequired'))
      return
    }

    setLoading(true)

    const result = await onSave(formData, customer?.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      onClose()
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
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

          <CRow className="mb-3">
            <CCol md={6}>
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
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="company">{t('form.company')}</CFormLabel>
              <CFormInput
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder={t('form.companyPlaceholder')}
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="email">{t('form.email')}</CFormLabel>
              <CFormInput
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('form.emailPlaceholder')}
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="phone">{t('form.phone')}</CFormLabel>
              <CFormInput
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('form.phonePlaceholder')}
              />
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel htmlFor="address">{t('form.address')}</CFormLabel>
            <CFormInput
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t('form.addressPlaceholder')}
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="notes">{t('form.notes')}</CFormLabel>
            <CFormTextarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder={t('form.notesPlaceholder')}
            />
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

export default CustomerForm
