import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CFormLabel,
  CAlert,
  CSpinner,
} from '@coreui/react'

const ColumnFormModal = ({
  visible,
  onClose,
  column = null,
  onSave,
}) => {
  const { t } = useTranslation('kanban')
  const { t: tCommon } = useTranslation('common')

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isEditing = !!column

  useEffect(() => {
    if (visible) {
      setName(column?.name || '')
      setError(null)
    }
  }, [visible, column])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      setError(t('nameRequired'))
      return
    }

    setLoading(true)
    setError(null)

    const result = await onSave(name.trim(), column?.id)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <form onSubmit={handleSubmit}>
        <CModalHeader>
          <CModalTitle>
            {isEditing ? t('editColumn') : t('newColumn')}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}

          <div className="mb-3">
            <CFormLabel htmlFor="columnName">{t('columnName')}</CFormLabel>
            <CFormInput
              id="columnName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('columnNamePlaceholder')}
              autoFocus
            />
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {tCommon('actions.cancel')}
          </CButton>
          <CButton
            color="primary"
            type="submit"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {tCommon('status.saving')}
              </>
            ) : (
              tCommon('actions.save')
            )}
          </CButton>
        </CModalFooter>
      </form>
    </CModal>
  )
}

export default ColumnFormModal
