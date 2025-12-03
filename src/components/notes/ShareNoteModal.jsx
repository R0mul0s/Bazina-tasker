import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CInputGroup,
  CFormInput,
  CInputGroupText,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilLink,
  cilCopy,
  cilCheckCircle,
  cilShareAlt,
  cilBan,
} from '@coreui/icons'

const ShareNoteModal = ({ visible, onClose, note, onShare, onUnshare, onNoteUpdate }) => {
  const { t } = useTranslation('notes')
  const { t: tCommon } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const isShared = note?.is_shared && note?.share_token

  const shareUrl = isShared
    ? `${window.location.origin}/shared/${note.share_token}`
    : null

  const handleShare = async () => {
    setLoading(true)
    setError(null)

    const { data, error: shareError } = await onShare(note.id)

    if (shareError) {
      setError(shareError)
    } else if (data && onNoteUpdate) {
      onNoteUpdate(data)
    }

    setLoading(false)
  }

  const handleUnshare = async () => {
    setLoading(true)
    setError(null)

    const { data, error: unshareError } = await onUnshare(note.id)

    if (unshareError) {
      setError(unshareError)
    } else if (data && onNoteUpdate) {
      onNoteUpdate(data)
    }

    setLoading(false)
  }

  const handleCopy = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback pro starší prohlížeče
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setError(null)
    setCopied(false)
    onClose()
  }

  return (
    <CModal visible={visible} onClose={handleClose}>
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilShareAlt} className="me-2" />
          {t('share.title')}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && (
          <CAlert color="danger" className="mb-3">
            {error}
          </CAlert>
        )}

        {isShared ? (
          <>
            <div className="d-flex align-items-center gap-2 p-3 mb-3 rounded border border-success bg-success bg-opacity-10">
              <CIcon icon={cilCheckCircle} className="text-success flex-shrink-0" />
              <span>{t('share.activeDescription')}</span>
            </div>

            <label className="form-label">{t('share.copyLink')}</label>
            <CInputGroup className="mb-3">
              <CFormInput
                value={shareUrl}
                readOnly
                className="bg-body-secondary"
              />
              <CButton
                color={copied ? 'success' : 'primary'}
                onClick={handleCopy}
              >
                <CIcon icon={copied ? cilCheckCircle : cilCopy} className="me-1" />
                {copied ? tCommon('status.copied') : tCommon('actions.copy')}
              </CButton>
            </CInputGroup>

            <small className="text-secondary">
              {t('share.sharedAt', {
                date: new Date(note.shared_at).toLocaleDateString(),
              })}
            </small>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <CIcon icon={cilLink} size="3xl" className="text-secondary mb-3" />
              <p className="mb-0">{t('share.description')}</p>
            </div>
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={handleClose}>
          {tCommon('actions.close')}
        </CButton>

        {isShared ? (
          <CButton
            color="danger"
            variant="outline"
            onClick={handleUnshare}
            disabled={loading}
          >
            {loading ? (
              <CSpinner size="sm" className="me-1" />
            ) : (
              <CIcon icon={cilBan} className="me-1" />
            )}
            {t('share.stopSharing')}
          </CButton>
        ) : (
          <CButton color="primary" onClick={handleShare} disabled={loading}>
            {loading ? (
              <CSpinner size="sm" className="me-1" />
            ) : (
              <CIcon icon={cilShareAlt} className="me-1" />
            )}
            {t('share.createLink')}
          </CButton>
        )}
      </CModalFooter>
    </CModal>
  )
}

export default ShareNoteModal
