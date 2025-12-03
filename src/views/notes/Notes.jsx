import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CButton,
  CSpinner,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilNotes,
  cilPencil,
  cilTrash,
  cilCalendar,
  cilCheckCircle,
  cilX,
  cilClock,
} from '@coreui/icons'
import { useNotes } from '../../hooks/useNotes'
import { useCustomers } from '../../hooks/useCustomers'
import { useTags } from '../../hooks/useTags'
import { useBulkActions } from '../../hooks/useBulkActions'
import NoteForm from '../../components/notes/NoteForm'
import SmartTable from '../../components/common/SmartTable'
import { formatDate, formatRelativeTime, formatDuration } from '../../lib/utils'
import { ListCardSkeleton } from '../../components/common/Skeleton'

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

const Notes = () => {
  const navigate = useNavigate()
  const { notes, loading, createNote, updateNote, deleteNote, fetchNotes } = useNotes()
  const { customers, loading: customersLoading } = useCustomers()
  const { tags, loading: tagsLoading } = useTags()
  const { loading: bulkLoading, bulkUpdateStatus, bulkUpdatePriority, bulkDelete, bulkAddTag } = useBulkActions()

  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ show: false, note: null })
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

  // Bulk selection state
  const [selectedNotes, setSelectedNotes] = useState(new Set())
  const [bulkMessage, setBulkMessage] = useState(null)

  const isLoading = loading || customersLoading || tagsLoading
  const isSomeSelected = selectedNotes.size > 0

  // Přidat customer_name pro vyhledávání
  const notesWithCustomerName = useMemo(() => {
    return notes.map(note => ({
      ...note,
      customer_name: note.customer?.name || note.customer?.company || '',
      status_label: statusLabels[note.status] || note.status,
      priority_label: priorityLabels[note.priority] || note.priority,
    }))
  }, [notes])

  // Definice sloupců pro SmartTable
  const columns = [
    {
      key: 'title',
      label: 'Název',
      _style: { minWidth: '200px' },
    },
    {
      key: 'customer_name',
      label: 'Zákazník',
      _style: { width: '150px' },
    },
    {
      key: 'status_label',
      label: 'Stav',
      _style: { width: '120px' },
    },
    {
      key: 'priority_label',
      label: 'Priorita',
      _style: { width: '100px' },
    },
    {
      key: 'meeting_date',
      label: 'Datum',
      _style: { width: '100px' },
    },
    {
      key: 'actions',
      label: 'Akce',
      _style: { width: '80px' },
      filter: false,
      sorter: false,
    },
  ]

  // Custom renderování sloupců
  const scopedSlots = {
    title: (item) => (
      <div>
        <strong>{item.title}</strong>
        {item.tags?.length > 0 && (
          <div className="d-flex gap-1 mt-1 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag.id}
                className={`tag-badge tag-badge--${tag.color || 'gray'}`}
                style={{ fontSize: '0.7rem', padding: '0.2em 0.4em' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <div className="d-flex gap-2 mt-1">
          {item.tasks?.length > 0 && (
            <small className="text-secondary">
              <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
              {item.tasks.filter((t) => t.is_completed).length}/{item.tasks.length}
            </small>
          )}
          {item.total_time_minutes > 0 && (
            <small className="text-secondary">
              <CIcon icon={cilClock} size="sm" className="me-1" />
              {formatDuration(item.total_time_minutes)}
            </small>
          )}
        </div>
      </div>
    ),
    customer_name: (item) => (
      <span className="text-secondary small">{item.customer_name || '-'}</span>
    ),
    status_label: (item) => (
      <CBadge color={statusColors[item.status]} size="sm">
        {statusLabels[item.status]}
      </CBadge>
    ),
    priority_label: (item) => (
      <CBadge color={priorityColors[item.priority]} size="sm">
        {priorityLabels[item.priority]}
      </CBadge>
    ),
    meeting_date: (item) => (
      <span className="text-secondary small">
        {item.meeting_date ? formatDate(item.meeting_date) : '-'}
      </span>
    ),
    actions: (item) => (
      <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
        <CButton
          color="light"
          size="sm"
          onClick={(e) => handleEdit(item, e)}
          title="Upravit"
        >
          <CIcon icon={cilPencil} />
        </CButton>
        <CButton
          color="light"
          size="sm"
          className="text-danger"
          onClick={(e) => {
            e.stopPropagation()
            setDeleteModal({ show: true, note: item })
          }}
          title="Smazat"
        >
          <CIcon icon={cilTrash} />
        </CButton>
      </div>
    ),
  }

  // Bulk action handlers
  const handleBulkStatus = async (status) => {
    const { error, count } = await bulkUpdateStatus(Array.from(selectedNotes), status)
    if (!error) {
      setBulkMessage({ type: 'success', text: `${count} poznámek aktualizováno` })
      await fetchNotes()
      setSelectedNotes(new Set())
    } else {
      setBulkMessage({ type: 'danger', text: error })
    }
    setTimeout(() => setBulkMessage(null), 3000)
  }

  const handleBulkPriority = async (priority) => {
    const { error, count } = await bulkUpdatePriority(Array.from(selectedNotes), priority)
    if (!error) {
      setBulkMessage({ type: 'success', text: `${count} poznámek aktualizováno` })
      await fetchNotes()
      setSelectedNotes(new Set())
    } else {
      setBulkMessage({ type: 'danger', text: error })
    }
    setTimeout(() => setBulkMessage(null), 3000)
  }

  const handleBulkDelete = async () => {
    const { error, count } = await bulkDelete(Array.from(selectedNotes))
    if (!error) {
      setBulkMessage({ type: 'success', text: `${count} poznámek smazáno` })
      await fetchNotes()
      setSelectedNotes(new Set())
    } else {
      setBulkMessage({ type: 'danger', text: error })
    }
    setBulkDeleteModal(false)
    setTimeout(() => setBulkMessage(null), 3000)
  }

  const handleBulkAddTag = async (tagId) => {
    const { error, count } = await bulkAddTag(Array.from(selectedNotes), tagId)
    if (!error) {
      setBulkMessage({ type: 'success', text: `Tag přidán k ${count} poznámkám` })
      await fetchNotes()
      setSelectedNotes(new Set())
    } else {
      setBulkMessage({ type: 'danger', text: error })
    }
    setTimeout(() => setBulkMessage(null), 3000)
  }

  const handleSave = async (noteData, tagIds, noteId) => {
    if (noteId) {
      return await updateNote(noteId, noteData, tagIds)
    } else {
      const result = await createNote(noteData, tagIds)
      if (!result.error && result.data?.id) {
        navigate(`/notes/${result.data.id}`)
      }
      return result
    }
  }

  const handleEdit = (note, e) => {
    e.stopPropagation()
    setEditingNote(note)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (deleteModal.note) {
      await deleteNote(deleteModal.note.id)
      setDeleteModal({ show: false, note: null })
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingNote(null)
  }

  if (isLoading) {
    return <ListCardSkeleton count={5} />
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Poznámky</h2>
        <CButton
          color="primary"
          onClick={() => setShowForm(true)}
          disabled={customers.length === 0}
        >
          <CIcon icon={cilPlus} className="me-2" />
          Nová poznámka
        </CButton>
      </div>

      {bulkMessage && (
        <CAlert color={bulkMessage.type} dismissible onClose={() => setBulkMessage(null)}>
          {bulkMessage.text}
        </CAlert>
      )}

      {/* Bulk action toolbar */}
      {isSomeSelected && (
        <CCard className="mb-3 border-primary">
          <CCardBody className="py-2">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="fw-semibold">
                Vybráno: {selectedNotes.size}
              </span>

              <CDropdown>
                <CDropdownToggle color="light" size="sm" disabled={bulkLoading}>
                  Změnit stav
                </CDropdownToggle>
                <CDropdownMenu>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <CDropdownItem key={value} onClick={() => handleBulkStatus(value)}>
                      <CBadge color={statusColors[value]} className="me-2">{label}</CBadge>
                    </CDropdownItem>
                  ))}
                </CDropdownMenu>
              </CDropdown>

              <CDropdown>
                <CDropdownToggle color="light" size="sm" disabled={bulkLoading}>
                  Změnit prioritu
                </CDropdownToggle>
                <CDropdownMenu>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <CDropdownItem key={value} onClick={() => handleBulkPriority(value)}>
                      <CBadge color={priorityColors[value]} className="me-2">{label}</CBadge>
                    </CDropdownItem>
                  ))}
                </CDropdownMenu>
              </CDropdown>

              {tags.length > 0 && (
                <CDropdown>
                  <CDropdownToggle color="light" size="sm" disabled={bulkLoading}>
                    Přidat tag
                  </CDropdownToggle>
                  <CDropdownMenu>
                    {tags.map((tag) => (
                      <CDropdownItem key={tag.id} onClick={() => handleBulkAddTag(tag.id)}>
                        <span className={`tag-badge tag-badge--${tag.color || 'gray'} me-2`}>
                          {tag.name}
                        </span>
                      </CDropdownItem>
                    ))}
                  </CDropdownMenu>
                </CDropdown>
              )}

              <CButton
                color="danger"
                size="sm"
                variant="outline"
                onClick={() => setBulkDeleteModal(true)}
                disabled={bulkLoading}
              >
                <CIcon icon={cilTrash} className="me-1" />
                Smazat
              </CButton>

              <CButton
                color="light"
                size="sm"
                onClick={() => setSelectedNotes(new Set())}
                className="ms-auto"
              >
                <CIcon icon={cilX} className="me-1" />
                Zrušit výběr
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}

      <CCard>
        <CCardBody>
          {customers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CIcon icon={cilNotes} size="3xl" />
              </div>
              <div className="empty-state__title">Žádní zákazníci</div>
              <div className="empty-state__description">
                Nejprve přidejte zákazníka, abyste mohli vytvářet poznámky.
              </div>
              <CButton color="primary" onClick={() => navigate('/customers')}>
                <CIcon icon={cilPlus} className="me-2" />
                Přidat zákazníka
              </CButton>
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CIcon icon={cilNotes} size="3xl" />
              </div>
              <div className="empty-state__title">Žádné poznámky</div>
              <div className="empty-state__description">
                Vytvořte první poznámku kliknutím na tlačítko výše.
              </div>
            </div>
          ) : (
            <SmartTable
              items={notesWithCustomerName}
              columns={columns}
              columnFilter
              tableFilter
              sorter
              pagination
              itemsPerPage={10}
              itemsPerPageOptions={[5, 10, 20, 50]}
              selectable
              selected={selectedNotes}
              onSelectedChange={setSelectedNotes}
              scopedSlots={scopedSlots}
              onRowClick={(item) => navigate(`/notes/${item.id}`)}
              tableFilterLabel="Filtr:"
              tableFilterPlaceholder="hledaný text..."
              noItemsLabel="Žádné poznámky nenalezeny"
              itemsPerPageLabel="Položek na stránku:"
            />
          )}
        </CCardBody>
      </CCard>

      {/* Formulář pro vytvoření/úpravu */}
      <NoteForm
        visible={showForm}
        onClose={handleCloseForm}
        onSave={handleSave}
        note={editingNote}
        customers={customers}
        tags={tags}
      />

      {/* Potvrzení smazání jedné poznámky */}
      <CModal
        visible={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, note: null })}
      >
        <CModalHeader>
          <CModalTitle>Smazat poznámku</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Opravdu chcete smazat poznámku <strong>{deleteModal.note?.title}</strong>?
          <br />
          <small className="text-danger">
            Tato akce smaže i všechny přílohy a úkoly této poznámky.
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteModal({ show: false, note: null })}
          >
            Zrušit
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            Smazat
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Potvrzení hromadného smazání */}
      <CModal
        visible={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Hromadné smazání</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Opravdu chcete smazat <strong>{selectedNotes.size}</strong> vybraných poznámek?
          <br />
          <small className="text-danger">
            Tato akce smaže i všechny přílohy a úkoly těchto poznámek a nelze ji vrátit zpět.
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setBulkDeleteModal(false)}
          >
            Zrušit
          </CButton>
          <CButton color="danger" onClick={handleBulkDelete} disabled={bulkLoading}>
            {bulkLoading ? <CSpinner size="sm" /> : 'Smazat vše'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Notes
