import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CRow,
  CCol,
  CBadge,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPencil,
  cilTrash,
  cilArrowLeft,
  cilCalendar,
  cilCloudUpload,
  cilUser,
} from '@coreui/icons'
import { useNotes } from '../../hooks/useNotes'
import { useCustomers } from '../../hooks/useCustomers'
import { useTags } from '../../hooks/useTags'
import { useAttachments } from '../../hooks/useAttachments'
import NoteForm from '../../components/notes/NoteForm'
import TimeTracking from '../../components/notes/TimeTracking'
import AttachmentList from '../../components/notes/AttachmentList'
import SortableTaskList from '../../components/notes/SortableTaskList'
import AuditHistory from '../../components/common/AuditHistory'
import { formatDate, formatDateTime } from '../../lib/utils'

const priorityColors = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

const priorityLabels = {
  low: 'Nízká',
  medium: 'Střední',
  high: 'Vysoká',
}

const statusLabels = {
  draft: 'Koncept',
  requires_action: 'Vyžaduje akci',
  completed: 'Dokončeno',
  archived: 'Archivováno',
}

const statusColors = {
  draft: 'secondary',
  requires_action: 'danger',
  completed: 'success',
  archived: 'dark',
}

const meetingTypeLabels = {
  phone: 'Telefonát',
  video: 'Video hovor',
  in_person: 'Osobní schůzka',
  email: 'Email',
}

const NoteDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const { fetchNote, updateNote, deleteNote, updateTask } = useNotes()
  const { customers } = useCustomers()
  const { tags } = useTags()
  const { uploadFile, deleteFile, getFileUrl, fetchAttachments, uploading } = useAttachments()

  const [note, setNote] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [pasteMessage, setPasteMessage] = useState('')

  // Funkce pro upload obrázku z clipboardu
  const handlePasteUpload = async (file) => {
    setPasteMessage('Nahrávání obrázku...')
    const { data, error: uploadError } = await uploadFile(id, file)
    if (!uploadError && data) {
      setAttachments((prev) => [data, ...prev])
      setPasteMessage('Obrázek nahrán!')
    } else {
      setPasteMessage('Chyba při nahrávání: ' + (uploadError || 'Neznámá chyba'))
    }
    // Skrýt zprávu po 3 sekundách
    setTimeout(() => setPasteMessage(''), 3000)
  }

  // Listener pro Ctrl+V (paste) - nahrávání obrázků ze schránky
  useEffect(() => {
    const handlePaste = async (e) => {
      // Ignorovat, pokud je fokus na input/textarea (kromě file inputu)
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
            // Vytvořit soubor s názvem podle typu a času
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

  // Načtení poznámky
  useEffect(() => {
    const loadNote = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await fetchNote(id)

      if (error) {
        setError(error)
      } else {
        setNote(data)
      }

      // Načtení příloh
      const { data: attachmentsData } = await fetchAttachments(id)
      setAttachments(attachmentsData || [])

      setLoading(false)
    }

    loadNote()
  }, [id])

  const handleSave = async (noteData, tagIds) => {
    const result = await updateNote(id, noteData, tagIds)
    if (!result.error) {
      const { data } = await fetchNote(id)
      setNote(data)
    }
    return result
  }

  const handleDelete = async () => {
    await deleteNote(id)
    navigate('/notes')
  }

  const handleTaskToggle = async (taskId, isCompleted) => {
    // Optimistická aktualizace - nejprve změnit UI
    setNote((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, is_completed: !isCompleted } : t
      ),
    }))

    // Pak uložit do databáze
    const result = await updateTask(taskId, !isCompleted)
    if (result.error) {
      // Při chybě vrátit zpět
      setNote((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: isCompleted } : t
        ),
      }))
    }
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

    // Reset input
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error || !note) {
    return (
      <CAlert color="danger">
        {error || 'Poznámka nebyla nalezena.'}
        <CButton color="link" onClick={() => navigate('/notes')}>
          Zpět na seznam
        </CButton>
      </CAlert>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <CButton color="light" onClick={() => navigate('/notes')}>
            <CIcon icon={cilArrowLeft} />
          </CButton>
          <h2 className="mb-0">{note.title}</h2>
        </div>
        <div className="d-flex gap-2">
          <CButton color="primary" onClick={() => setShowForm(true)}>
            <CIcon icon={cilPencil} className="me-2" />
            Upravit
          </CButton>
          <CButton color="danger" variant="outline" onClick={() => setDeleteModal(true)}>
            <CIcon icon={cilTrash} className="me-2" />
            Smazat
          </CButton>
        </div>
      </div>

      <CRow>
        <CCol lg={8}>
          {/* Hlavní obsah */}
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Obsah poznámky</strong>
              <div className="d-flex gap-2">
                <CBadge color={statusColors[note.status]}>
                  {statusLabels[note.status]}
                </CBadge>
                <CBadge color={priorityColors[note.priority]}>
                  {priorityLabels[note.priority]}
                </CBadge>
              </div>
            </CCardHeader>
            <CCardBody>
              {note.content ? (
                <div
                  className="note-content"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
              ) : (
                <p className="text-secondary">Bez obsahu</p>
              )}
            </CCardBody>
          </CCard>

          {/* Úkoly */}
          {note.tasks && note.tasks.length > 0 && (
            <CCard className="mb-4">
              <CCardHeader>
                <strong>
                  Úkoly ({note.tasks.filter((t) => t.is_completed).length}/{note.tasks.length})
                </strong>
                <small className="text-secondary ms-2">
                  (přetažením změníte pořadí)
                </small>
              </CCardHeader>
              <CCardBody>
                <SortableTaskList
                  tasks={note.tasks.sort((a, b) => a.order - b.order)}
                  onToggle={handleTaskToggle}
                  onReorder={(newTasks) => {
                    setNote((prev) => ({ ...prev, tasks: newTasks }))
                  }}
                />
              </CCardBody>
            </CCard>
          )}

          {/* Přílohy */}
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Přílohy ({attachments.length})</strong>
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
                    Nahrát
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
              {/* Zpráva o vkládání ze schránky */}
              {pasteMessage && (
                <CAlert
                  color={pasteMessage.includes('Chyba') ? 'danger' : 'info'}
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
                    Klikněte pro nahrání nebo vložte obrázek (Ctrl+V)
                  </div>
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

        <CCol lg={4}>
          {/* Info karta */}
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Informace</strong>
            </CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <small className="text-secondary d-block">Zákazník</small>
                <div
                  className="d-flex align-items-center gap-2 cursor-pointer"
                  onClick={() => navigate(`/customers/${note.customer_id}`)}
                >
                  <CIcon icon={cilUser} />
                  <strong>{note.customer?.name || note.customer?.company}</strong>
                </div>
              </div>

              <div className="mb-3">
                <small className="text-secondary d-block">Typ schůzky</small>
                <div>{meetingTypeLabels[note.meeting_type]}</div>
              </div>

              {note.meeting_date && (
                <div className="mb-3">
                  <small className="text-secondary d-block">Datum schůzky</small>
                  <div className="d-flex align-items-center gap-2">
                    <CIcon icon={cilCalendar} />
                    {formatDate(note.meeting_date)}
                  </div>
                </div>
              )}

              {note.follow_up_date && (
                <div className="mb-3">
                  <small className="text-secondary d-block">Follow-up</small>
                  <div className="d-flex align-items-center gap-2">
                    <CIcon icon={cilCalendar} />
                    <CBadge color="warning">{formatDate(note.follow_up_date)}</CBadge>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <small className="text-secondary d-block">Vytvořeno</small>
                <div>{formatDateTime(note.created_at)}</div>
              </div>

              {note.updated_at !== note.created_at && (
                <div className="mb-3">
                  <small className="text-secondary d-block">Upraveno</small>
                  <div>{formatDateTime(note.updated_at)}</div>
                </div>
              )}
            </CCardBody>
          </CCard>

          {/* Tagy */}
          {note.tags && note.tags.length > 0 && (
            <CCard className="mb-4">
              <CCardHeader>
                <strong>Tagy</strong>
              </CCardHeader>
              <CCardBody>
                <div className="d-flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`tag-badge tag-badge--lg tag-badge--${tag.color || 'gray'}`}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </CCardBody>
            </CCard>
          )}

          {/* Sledování času */}
          <TimeTracking noteId={id} />

          {/* Historie změn */}
          <AuditHistory tableName="notes" recordId={id} />
        </CCol>
      </CRow>

      {/* Formulář pro úpravu */}
      <NoteForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        note={note}
        customers={customers}
        tags={tags}
      />

      {/* Potvrzení smazání */}
      <CModal visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Smazat poznámku</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Opravdu chcete smazat poznámku <strong>{note.title}</strong>?
          <br />
          <small className="text-danger">
            Tato akce smaže i všechny přílohy a úkoly této poznámky.
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModal(false)}>
            Zrušit
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            Smazat
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default NoteDetail
