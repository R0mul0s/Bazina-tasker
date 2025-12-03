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
  CFormTextarea,
  CFormLabel,
  CRow,
  CCol,
  CSpinner,
  CAlert,
} from '@coreui/react'

const CustomerForm = ({ visible, onClose, onSave, customer = null }) => {
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
      setError('Jméno je povinné')
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
          {isEditing ? 'Upravit zákazníka' : 'Nový zákazník'}
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
              <CFormLabel htmlFor="name">Jméno kontaktní osoby *</CFormLabel>
              <CFormInput
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jan Novák"
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="company">Firma</CFormLabel>
              <CFormInput
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Firma s.r.o."
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="email">Email</CFormLabel>
              <CFormInput
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jan.novak@firma.cz"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="phone">Telefon</CFormLabel>
              <CFormInput
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+420 123 456 789"
              />
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel htmlFor="address">Adresa</CFormLabel>
            <CFormInput
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ulice 123, Praha 1, 110 00"
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="notes">Poznámky</CFormLabel>
            <CFormTextarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Obecné poznámky k zákazníkovi..."
            />
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

export default CustomerForm
