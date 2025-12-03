import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CRow,
  CCol,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
  CListGroup,
  CListGroupItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPencil,
  cilTrash,
  cilArrowLeft,
  cilPlus,
  cilEnvelopeClosed,
  cilPhone,
  cilLocationPin,
  cilNotes,
  cilCalendar,
  cilCheckCircle,
  cilCloudUpload,
  cilFile,
} from '@coreui/icons'
import { useCustomers } from '../../hooks/useCustomers'
import { useNotes } from '../../hooks/useNotes'
import { useTags } from '../../hooks/useTags'
import { useCustomerAttachments } from '../../hooks/useCustomerAttachments'
import CustomerForm from '../../components/customers/CustomerForm'
import NoteForm from '../../components/notes/NoteForm'
import AttachmentList from '../../components/notes/AttachmentList'
import AuditHistory from '../../components/common/AuditHistory'
import { useLocaleFormat } from '../../hooks/useLocaleFormat'

const priorityColors = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

const statusColors = {
  draft: 'secondary',
  requires_action: 'danger',
  completed: 'success',
  archived: 'dark',
}

const CustomerDetail = () => {
  const { t } = useTranslation('customers')
  const { t: tCommon } = useTranslation('common')
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { formatDate, formatRelativeTime } = useLocaleFormat()

  const { customers, updateCustomer, deleteCustomer } = useCustomers()
  const { notes, loading: notesLoading, createNote, updateNote } = useNotes(id)
  const { tags } = useTags()
  const {
    uploadFile,
    deleteFile,
    getFileUrl,
    fetchAttachments,
    uploading,
  } = useCustomerAttachments()

  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [pasteMessage, setPasteMessage] = useState('')

  // Najít zákazníka
  useEffect(() => {
    if (customers.length > 0) {
      const found = customers.find((c) => c.id === id)
      setCustomer(found || null)
      setLoading(false)
    }
  }, [customers, id])

  // Načtení příloh
  useEffect(() => {
    const loadAttachments = async () => {
      if (id) {
        const { data } = await fetchAttachments(id)
        setAttachments(data || [])
      }
    }
    loadAttachments()
  }, [id, fetchAttachments])

  // Listener pro Ctrl+V (paste) - nahrávání obrázků ze schránky
  useEffect(() => {
    const handlePaste = async (e) => {
      // Ignorovat, pokud je fokus na input/textarea
      const activeEl = document.activeElement
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if (activeEl.type !== 'file') return
      }

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) {
            const extension = item.type.split('/')[1] || 'png'
            const filename = `screenshot_${Date.now()}.${extension}`
            const file = new File([blob], filename, { type: item.type })
            await handlePasteUpload(file)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [id, uploadFile])

  const handlePasteUpload = async (file) => {
    setPasteMessage(t('attachments.uploadingImage'))
    const { data, error } = await uploadFile(id, file)
    if (!error && data) {
      setAttachments((prev) => [data, ...prev])
      setPasteMessage(t('attachments.imageUploaded'))
    } else {
      setPasteMessage(t('attachments.uploadError') + ' ' + (error || 'Unknown error'))
    }
    setTimeout(() => setPasteMessage(''), 3000)
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    for (const file of files) {
      const { data, error } = await uploadFile(id, file)
      if (!error && data) {
        setAttachments((prev) => [data, ...prev])
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileDelete = async (attachment) => {
    const { error } = await deleteFile(attachment)
    if (!error) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
    }
  }

  const handleFileDownload = async (attachment) => {
    const url = await getFileUrl(attachment.file_url)
    if (url) {
      window.open(url, '_blank')
    }
  }

  const handleCustomerSave = async (data) => {
    const result = await updateCustomer(id, data)
    if (!result.error) {
      setCustomer({ ...customer, ...data })
    }
    return result
  }

  const handleCustomerDelete = async () => {
    await deleteCustomer(id)
    navigate('/customers')
  }

  const handleNoteSave = async (noteData, tagIds, noteId) => {
    if (noteId) {
      return await updateNote(noteId, noteData, tagIds)
    } else {
      const result = await createNote({ ...noteData, customer_id: id }, tagIds)
      // Po vytvoření nové poznámky přesměrovat na detail (pro nahrání příloh)
      if (!result.error && result.data?.id) {
        navigate(`/notes/${result.data.id}`)
      }
      return result
    }
  }

  const handleNoteEdit = (note) => {
    setEditingNote(note)
    setShowNoteForm(true)
  }

  const handleCloseNoteForm = () => {
    setShowNoteForm(false)
    setEditingNote(null)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (!customer) {
    return (
      <CAlert color="danger">
        {t('detail.customerNotFound')}
        <CButton color="link" onClick={() => navigate('/customers')}>
          {tCommon('actions.backToList')}
        </CButton>
      </CAlert>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <CButton color="light" onClick={() => navigate('/customers')}>
            <CIcon icon={cilArrowLeft} />
          </CButton>
          <div>
            <h2 className="mb-0">{customer.name}</h2>
            {customer.company && (
              <small className="text-secondary">{customer.company}</small>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <CButton color="primary" onClick={() => setShowCustomerForm(true)}>
            <CIcon icon={cilPencil} className="me-2" />
            {tCommon('actions.edit')}
          </CButton>
          <CButton color="danger" variant="outline" onClick={() => setDeleteModal(true)}>
            <CIcon icon={cilTrash} className="me-2" />
            {tCommon('actions.delete')}
          </CButton>
        </div>
      </div>

      <CRow>
        <CCol lg={4}>
          {/* Kontaktní informace */}
          <CCard className="mb-4">
            <CCardHeader>
              <strong>{t('detail.contactInfo')}</strong>
            </CCardHeader>
            <CCardBody>
              {customer.email && (
                <div className="mb-3">
                  <small className="text-secondary d-block">{t('detail.email')}</small>
                  <div className="d-flex align-items-center gap-2">
                    <CIcon icon={cilEnvelopeClosed} />
                    <a href={`mailto:${customer.email}`}>{customer.email}</a>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="mb-3">
                  <small className="text-secondary d-block">{t('detail.phone')}</small>
                  <div className="d-flex align-items-center gap-2">
                    <CIcon icon={cilPhone} />
                    <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="mb-3">
                  <small className="text-secondary d-block">{t('detail.address')}</small>
                  <div className="d-flex align-items-center gap-2">
                    <CIcon icon={cilLocationPin} />
                    <span>{customer.address}</span>
                  </div>
                </div>
              )}

              {!customer.email && !customer.phone && !customer.address && (
                <p className="text-secondary mb-0">{t('detail.noContactInfo')}</p>
              )}
            </CCardBody>
          </CCard>

          {/* Poznámky k zákazníkovi */}
          {customer.notes && (
            <CCard className="mb-4">
              <CCardHeader>
                <strong>{t('detail.notes')}</strong>
              </CCardHeader>
              <CCardBody>
                <p className="mb-0">{customer.notes}</p>
              </CCardBody>
            </CCard>
          )}

          {/* Přílohy zákazníka */}
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                <CIcon icon={cilFile} className="me-2" />
                {t('detail.documents')} ({attachments.length})
              </strong>
              <CButton
                color="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <CSpinner size="sm" />
                ) : (
                  <>
                    <CIcon icon={cilCloudUpload} className="me-1" />
                    {tCommon('actions.upload')}
                  </>
                )}
              </CButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="d-none"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
            </CCardHeader>
            <CCardBody>
              {pasteMessage && (
                <CAlert
                  color={pasteMessage.includes(t('attachments.uploadError')) ? 'danger' : 'info'}
                  className="mb-3"
                >
                  {pasteMessage}
                </CAlert>
              )}

              {attachments.length === 0 ? (
                <div
                  className="attachment-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="attachment-dropzone__icon">
                    <CIcon icon={cilCloudUpload} size="xl" />
                  </div>
                  <div className="attachment-dropzone__text">
                    {t('attachments.uploadHint')}
                  </div>
                  <small className="text-secondary d-block mt-2">
                    {t('attachments.documentsHint')}
                  </small>
                </div>
              ) : (
                <AttachmentList
                  attachments={attachments}
                  onDownload={handleFileDownload}
                  onDelete={handleFileDelete}
                  getFileUrl={getFileUrl}
                />
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={8}>
          {/* Poznámky ze schůzek */}
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>{t('detail.meetingNotes')} ({notes.length})</strong>
              <CButton color="primary" size="sm" onClick={() => setShowNoteForm(true)}>
                <CIcon icon={cilPlus} className="me-1" />
                {t('detail.newNote')}
              </CButton>
            </CCardHeader>
            <CCardBody>
              {notesLoading ? (
                <div className="d-flex justify-content-center py-3">
                  <CSpinner color="primary" />
                </div>
              ) : notes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">
                    <CIcon icon={cilNotes} size="3xl" />
                  </div>
                  <div className="empty-state__title">{t('detail.noNotes')}</div>
                  <div className="empty-state__description">
                    {t('detail.noNotesDescription')}
                  </div>
                  <CButton color="primary" onClick={() => setShowNoteForm(true)}>
                    <CIcon icon={cilPlus} className="me-2" />
                    {t('detail.createNote')}
                  </CButton>
                </div>
              ) : (
                <CListGroup flush>
                  {notes.map((note) => (
                    <CListGroupItem
                      key={note.id}
                      className="cursor-pointer note-list-item"
                      onClick={() => navigate(`/notes/${note.id}`)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <strong>{note.title}</strong>
                            <CBadge color={statusColors[note.status]} size="sm">
                              {tCommon(`noteStatus.${note.status}`)}
                            </CBadge>
                            <CBadge color={priorityColors[note.priority]} size="sm">
                              {tCommon(`priority.${note.priority}`)}
                            </CBadge>
                          </div>
                          <div className="text-secondary small mb-1">
                            {note.meeting_date && (
                              <span className="me-3">
                                <CIcon icon={cilCalendar} size="sm" className="me-1" />
                                {formatDate(note.meeting_date)}
                              </span>
                            )}
                            <span>{formatRelativeTime(note.created_at)}</span>
                          </div>
                          {note.tags?.length > 0 && (
                            <div className="d-flex gap-1 mb-1">
                              {note.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className={`tag-badge tag-badge--${tag.color || 'gray'}`}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {note.tasks?.length > 0 && (
                            <div className="small text-secondary">
                              <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
                              {note.tasks.filter((t) => t.is_completed).length}/{note.tasks.length}
                            </div>
                          )}
                        </div>
                        <CButton
                          color="light"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNoteEdit(note)
                          }}
                          title={tCommon('actions.edit')}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                      </div>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Historie změn */}
      <CRow>
        <CCol lg={12}>
          <AuditHistory tableName="customers" recordId={id} />
        </CCol>
      </CRow>

      {/* Formulář pro úpravu zákazníka */}
      <CustomerForm
        visible={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        onSave={handleCustomerSave}
        customer={customer}
      />

      {/* Formulář pro poznámku */}
      <NoteForm
        visible={showNoteForm}
        onClose={handleCloseNoteForm}
        onSave={handleNoteSave}
        note={editingNote}
        customers={customers}
        tags={tags}
        preselectedCustomerId={id}
      />

      {/* Potvrzení smazání */}
      <CModal visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>{t('delete.title')}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {t('delete.confirm', { name: customer.name })}
          <br />
          <small className="text-danger">
            {t('delete.warning')}
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModal(false)}>
            {tCommon('actions.cancel')}
          </CButton>
          <CButton color="danger" onClick={handleCustomerDelete}>
            {tCommon('actions.delete')}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default CustomerDetail
