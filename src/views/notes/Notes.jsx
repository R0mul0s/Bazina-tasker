import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CRow,
  CCol,
  CBadge,
  CInputGroup,
  CFormInput,
  CFormSelect,
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CListGroup,
  CListGroupItem,
  CFormCheck,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilNotes,
  cilSearch,
  cilPencil,
  cilTrash,
  cilFilter,
  cilCalendar,
  cilCheckCircle,
  cilOptions,
  cilCheckAlt,
  cilX,
  cilClock,
} from '@coreui/icons'
import { useNotes } from '../../hooks/useNotes'
import { useCustomers } from '../../hooks/useCustomers'
import { useTags } from '../../hooks/useTags'
import { useBulkActions } from '../../hooks/useBulkActions'
import NoteForm from '../../components/notes/NoteForm'
import { formatDate, formatRelativeTime, truncateText, formatDuration } from '../../lib/utils'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    customer_id: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Bulk selection state
  const [selectedNotes, setSelectedNotes] = useState(new Set())
  const [bulkMessage, setBulkMessage] = useState(null)

  const isLoading = loading || customersLoading || tagsLoading

  // Filtrování poznámek
  const filteredNotes = notes.filter((note) => {
    // Textové vyhledávání
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        note.title?.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query) ||
        note.customer?.name?.toLowerCase().includes(query) ||
        note.customer?.company?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Filtr podle stavu
    if (filters.status && note.status !== filters.status) return false

    // Filtr podle priority
    if (filters.priority && note.priority !== filters.priority) return false

    // Filtr podle zákazníka
    if (filters.customer_id && note.customer_id !== filters.customer_id) return false

    return true
  })

  // Selection helpers
  const isAllSelected = filteredNotes.length > 0 && filteredNotes.every(n => selectedNotes.has(n.id))
  const isSomeSelected = selectedNotes.size > 0

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNotes(new Set())
    } else {
      setSelectedNotes(new Set(filteredNotes.map(n => n.id)))
    }
  }

  const toggleSelect = (noteId) => {
    const newSelected = new Set(selectedNotes)
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId)
    } else {
      newSelected.add(noteId)
    }
    setSelectedNotes(newSelected)
  }

  const clearSelection = () => {
    setSelectedNotes(new Set())
  }

  // Bulk action handlers
  const handleBulkStatus = async (status) => {
    const { error, count } = await bulkUpdateStatus(Array.from(selectedNotes), status)
    if (!error) {
      setBulkMessage({ type: 'success', text: `${count} poznámek aktualizováno` })
      await fetchNotes()
      clearSelection()
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
      clearSelection()
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
      clearSelection()
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
      clearSelection()
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
      // Po vytvoření nové poznámky přesměrovat na detail (pro nahrání příloh)
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

  const clearFilters = () => {
    setFilters({ status: '', priority: '', customer_id: '' })
    setSearchQuery('')
  }

  const hasActiveFilters = filters.status || filters.priority || filters.customer_id || searchQuery

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CSpinner color="primary" />
      </div>
    )
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

      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            {filteredNotes.length > 0 && (
              <CFormCheck
                id="select-all"
                checked={isAllSelected}
                indeterminate={isSomeSelected && !isAllSelected}
                onChange={toggleSelectAll}
                title="Vybrat vše"
              />
            )}
            <strong>Seznam poznámek ({filteredNotes.length})</strong>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <CInputGroup style={{ maxWidth: '250px' }}>
              <CInputGroupText>
                <CIcon icon={cilSearch} />
              </CInputGroupText>
              <CFormInput
                placeholder="Hledat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </CInputGroup>
            <CButton
              color={showFilters ? 'primary' : 'light'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <CIcon icon={cilFilter} className="me-1" />
              Filtry
              {hasActiveFilters && (
                <CBadge color="danger" shape="rounded-pill" className="ms-1">
                  !
                </CBadge>
              )}
            </CButton>
          </div>
        </CCardHeader>

        {/* Bulk action toolbar */}
        {isSomeSelected && (
          <div className="border-bottom p-3 bg-primary bg-opacity-10">
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
                onClick={clearSelection}
                className="ms-auto"
              >
                <CIcon icon={cilX} className="me-1" />
                Zrušit výběr
              </CButton>
            </div>
          </div>
        )}

        {showFilters && (
          <div className="border-bottom p-3 bg-light">
            <CRow className="g-2 align-items-end">
              <CCol xs={12} sm={6} md={3}>
                <label className="form-label small">Stav</label>
                <CFormSelect
                  size="sm"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">Všechny stavy</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol xs={12} sm={6} md={3}>
                <label className="form-label small">Priorita</label>
                <CFormSelect
                  size="sm"
                  value={filters.priority}
                  onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                >
                  <option value="">Všechny priority</option>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol xs={12} sm={6} md={3}>
                <label className="form-label small">Zákazník</label>
                <CFormSelect
                  size="sm"
                  value={filters.customer_id}
                  onChange={(e) => setFilters((f) => ({ ...f, customer_id: e.target.value }))}
                >
                  <option value="">Všichni zákazníci</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol xs={12} sm={6} md={3}>
                {hasActiveFilters && (
                  <CButton color="link" size="sm" onClick={clearFilters}>
                    Zrušit filtry
                  </CButton>
                )}
              </CCol>
            </CRow>
          </div>
        )}

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
          ) : filteredNotes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CIcon icon={cilNotes} size="3xl" />
              </div>
              <div className="empty-state__title">
                {hasActiveFilters ? 'Žádné poznámky nenalezeny' : 'Žádné poznámky'}
              </div>
              <div className="empty-state__description">
                {hasActiveFilters
                  ? 'Zkuste upravit filtry nebo vyhledávání.'
                  : 'Vytvořte první poznámku kliknutím na tlačítko výše.'}
              </div>
              {hasActiveFilters && (
                <CButton color="primary" onClick={clearFilters}>
                  Zrušit filtry
                </CButton>
              )}
            </div>
          ) : (
            <CListGroup flush>
              {filteredNotes.map((note) => (
                <CListGroupItem
                  key={note.id}
                  className={`cursor-pointer note-list-item ${selectedNotes.has(note.id) ? 'bg-primary bg-opacity-10' : ''}`}
                  onClick={() => navigate(`/notes/${note.id}`)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-start gap-3 flex-grow-1">
                      <div onClick={(e) => e.stopPropagation()}>
                        <CFormCheck
                          checked={selectedNotes.has(note.id)}
                          onChange={() => toggleSelect(note.id)}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong>{note.title}</strong>
                          <CBadge color={statusColors[note.status]} size="sm">
                            {statusLabels[note.status]}
                          </CBadge>
                          <CBadge color={priorityColors[note.priority]} size="sm">
                            {priorityLabels[note.priority]}
                          </CBadge>
                        </div>
                        <div className="text-secondary small mb-1">
                          <span className="me-3">
                            {note.customer?.name || note.customer?.company}
                          </span>
                          <span className="me-3">
                            {meetingTypeLabels[note.meeting_type]}
                          </span>
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
                        <div className="d-flex gap-3">
                          {note.tasks?.length > 0 && (
                            <div className="small text-secondary">
                              <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
                              {note.tasks.filter((t) => t.is_completed).length}/{note.tasks.length} úkolů
                            </div>
                          )}
                          {note.total_time_minutes > 0 && (
                            <div className="small text-secondary">
                              <CIcon icon={cilClock} size="sm" className="me-1" />
                              {formatDuration(note.total_time_minutes)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <CButton
                        color="light"
                        size="sm"
                        onClick={(e) => handleEdit(note, e)}
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
                          setDeleteModal({ show: true, note })
                        }}
                        title="Smazat"
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </div>
                  </div>
                </CListGroupItem>
              ))}
            </CListGroup>
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
