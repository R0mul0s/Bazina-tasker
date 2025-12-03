import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CCard,
  CCardBody,
  CCardHeader,
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
  CRow,
  CCol,
  CFormSelect,
  CFormInput,
  CFormCheck,
  CCollapse,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilNotes,
  cilPencil,
  cilTrash,
  cilCheckCircle,
  cilX,
  cilClock,
  cilFilter,
  cilFilterX,
  cilCopy,
} from '@coreui/icons'
import { useNotes } from '../../hooks/useNotes'
import { useCustomers } from '../../hooks/useCustomers'
import { useTags } from '../../hooks/useTags'
import { useBulkActions } from '../../hooks/useBulkActions'
import NoteForm from '../../components/notes/NoteForm'
import SmartTable from '../../components/common/SmartTable'
import ActionMenu from '../../components/common/ActionMenu'
import { formatDuration } from '../../lib/utils'
import { useLocaleFormat } from '../../hooks/useLocaleFormat'
import { ListCardSkeleton } from '../../components/common/Skeleton'

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

const Notes = () => {
  const { t } = useTranslation('notes')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()
  const { formatDate } = useLocaleFormat()
  const { notes, loading, createNote, updateNote, deleteNote, duplicateNote, fetchNotes } = useNotes()
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
  const [duplicating, setDuplicating] = useState(null) // note id being duplicated

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    status: '',
    tagId: '',
    dateFrom: '',
    dateTo: '',
    hasIncompleteTasks: false,
  })

  const isLoading = loading || customersLoading || tagsLoading
  const isSomeSelected = selectedNotes.size > 0

  // Check if any advanced filter is active
  const hasActiveAdvancedFilters = advancedFilters.status || advancedFilters.tagId ||
    advancedFilters.dateFrom || advancedFilters.dateTo || advancedFilters.hasIncompleteTasks

  // Filter notes with advanced filters
  const filteredNotes = useMemo(() => {
    let result = notes

    // Status filter
    if (advancedFilters.status) {
      result = result.filter(note => note.status === advancedFilters.status)
    }

    // Tag filter
    if (advancedFilters.tagId) {
      result = result.filter(note =>
        note.tags?.some(tag => tag.id === advancedFilters.tagId)
      )
    }

    // Date from filter
    if (advancedFilters.dateFrom) {
      const fromDate = new Date(advancedFilters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      result = result.filter(note => {
        const noteDate = new Date(note.created_at)
        return noteDate >= fromDate
      })
    }

    // Date to filter
    if (advancedFilters.dateTo) {
      const toDate = new Date(advancedFilters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      result = result.filter(note => {
        const noteDate = new Date(note.created_at)
        return noteDate <= toDate
      })
    }

    // Incomplete tasks filter
    if (advancedFilters.hasIncompleteTasks) {
      result = result.filter(note =>
        note.tasks?.some(task => !task.is_completed)
      )
    }

    return result
  }, [notes, advancedFilters])

  // Prepare notes for SmartTable
  const notesWithCustomerName = useMemo(() => {
    return filteredNotes.map(note => ({
      ...note,
      customer_name: note.customer?.name || note.customer?.company || '',
      status_label: tCommon(`noteStatus.${note.status}`),
      priority_label: tCommon(`priority.${note.priority}`),
    }))
  }, [filteredNotes, tCommon])

  // Clear advanced filters
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      status: '',
      tagId: '',
      dateFrom: '',
      dateTo: '',
      hasIncompleteTasks: false,
    })
  }

  // Definice sloupců pro SmartTable
  const columns = [
    {
      key: 'title',
      label: t('columns.title'),
      _style: { minWidth: '200px' },
    },
    {
      key: 'customer_name',
      label: t('columns.customer'),
      _style: { width: '150px' },
    },
    {
      key: 'status_label',
      label: t('columns.status'),
      _style: { width: '120px' },
    },
    {
      key: 'priority_label',
      label: t('columns.priority'),
      _style: { width: '100px' },
    },
    {
      key: 'created_at',
      label: t('columns.created'),
      _style: { width: '110px' },
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      _style: { width: '120px' },
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
        {tCommon(`noteStatus.${item.status}`)}
      </CBadge>
    ),
    priority_label: (item) => (
      <CBadge color={priorityColors[item.priority]} size="sm">
        {tCommon(`priority.${item.priority}`)}
      </CBadge>
    ),
    created_at: (item) => (
      <span className="text-secondary small">
        {formatDate(item.created_at)}
      </span>
    ),
    actions: (item) => (
      <div onClick={(e) => e.stopPropagation()}>
        <ActionMenu
          actions={[
            {
              icon: cilCopy,
              label: tCommon('actions.duplicate'),
              onClick: (e) => handleDuplicate(item, e),
              loading: duplicating === item.id,
            },
            {
              icon: cilPencil,
              label: tCommon('actions.edit'),
              onClick: (e) => handleEdit(item, e),
            },
            {
              icon: cilTrash,
              label: tCommon('actions.delete'),
              onClick: () => setDeleteModal({ show: true, note: item }),
              danger: true,
            },
          ]}
          iconsOnly
          breakpoint="lg"
        />
      </div>
    ),
  }

  // Bulk action handlers
  const handleBulkStatus = async (status) => {
    const { error, count } = await bulkUpdateStatus(Array.from(selectedNotes), status)
    if (!error) {
      setBulkMessage({ type: 'success', text: t('bulk.updated', { count }) })
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
      setBulkMessage({ type: 'success', text: t('bulk.updated', { count }) })
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
      setBulkMessage({ type: 'success', text: t('bulk.deleted', { count }) })
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
      setBulkMessage({ type: 'success', text: t('bulk.tagAdded', { count }) })
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

  const handleDuplicate = async (note, e) => {
    e.stopPropagation()
    setDuplicating(note.id)
    const { data, error } = await duplicateNote(note.id)
    setDuplicating(null)
    if (!error && data) {
      setBulkMessage({ type: 'success', text: t('detail.duplicated', { title: note.title }) })
      setTimeout(() => setBulkMessage(null), 3000)
      navigate(`/notes/${data.id}`)
    } else {
      setBulkMessage({ type: 'danger', text: error || t('detail.duplicateError') })
      setTimeout(() => setBulkMessage(null), 3000)
    }
  }

  if (isLoading) {
    return <ListCardSkeleton count={5} />
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{t('title')}</h2>
        <CButton
          color="primary"
          onClick={() => setShowForm(true)}
          disabled={customers.length === 0}
        >
          <CIcon icon={cilPlus} className="me-2" />
          {t('newNote')}
        </CButton>
      </div>

      {bulkMessage && (
        <CAlert color={bulkMessage.type} dismissible onClose={() => setBulkMessage(null)}>
          {bulkMessage.text}
        </CAlert>
      )}

      {/* Advanced Filters Card */}
      <CCard className="mb-3">
        <CCardHeader
          className="cursor-pointer d-flex justify-content-between align-items-center"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilFilter} />
            <strong>{t('filters.advancedFilters')}</strong>
            {hasActiveAdvancedFilters && (
              <CBadge color="primary" shape="rounded-pill">
                {[
                  advancedFilters.status,
                  advancedFilters.tagId,
                  advancedFilters.dateFrom,
                  advancedFilters.dateTo,
                  advancedFilters.hasIncompleteTasks
                ].filter(Boolean).length}
              </CBadge>
            )}
          </div>
          <small className="text-secondary">
            {showAdvancedFilters ? t('filters.hide') : t('filters.show')}
          </small>
        </CCardHeader>
        <CCollapse visible={showAdvancedFilters}>
          <CCardBody>
            <CRow className="g-3">
              <CCol xs={12} sm={6} md={3}>
                <label className="form-label small fw-semibold">{t('filters.status')}</label>
                <CFormSelect
                  size="sm"
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">{t('filters.allStatuses')}</option>
                  {['draft', 'requires_action', 'completed', 'archived'].map((status) => (
                    <option key={status} value={status}>{tCommon(`noteStatus.${status}`)}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol xs={12} sm={6} md={3}>
                <label className="form-label small fw-semibold">{t('filters.tag')}</label>
                <CFormSelect
                  size="sm"
                  value={advancedFilters.tagId}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, tagId: e.target.value }))}
                >
                  <option value="">{t('filters.allTags')}</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol xs={6} sm={6} md={2}>
                <label className="form-label small fw-semibold">{t('filters.dateFrom')}</label>
                <CFormInput
                  type="date"
                  size="sm"
                  value={advancedFilters.dateFrom}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, dateFrom: e.target.value }))}
                />
              </CCol>
              <CCol xs={6} sm={6} md={2}>
                <label className="form-label small fw-semibold">{t('filters.dateTo')}</label>
                <CFormInput
                  type="date"
                  size="sm"
                  value={advancedFilters.dateTo}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, dateTo: e.target.value }))}
                />
              </CCol>
              <CCol xs={12} sm={6} md={2} className="d-flex flex-column justify-content-end">
                <CFormCheck
                  id="incompleteTasks"
                  label={t('filters.incompleteTasks')}
                  checked={advancedFilters.hasIncompleteTasks}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, hasIncompleteTasks: e.target.checked }))}
                />
              </CCol>
            </CRow>
            {hasActiveAdvancedFilters && (
              <div className="mt-3 pt-3 border-top">
                <CButton
                  color="link"
                  size="sm"
                  className="p-0 text-danger"
                  onClick={clearAdvancedFilters}
                >
                  <CIcon icon={cilFilterX} className="me-1" />
                  {tCommon('actions.clearFilters')}
                </CButton>
                <span className="ms-3 text-secondary small">
                  {t('filters.showing', { shown: notesWithCustomerName.length, total: notes.length })}
                </span>
              </div>
            )}
          </CCardBody>
        </CCollapse>
      </CCard>

      {/* Bulk action toolbar */}
      {isSomeSelected && (
        <CCard className="mb-3 border-primary">
          <CCardBody className="py-2">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="fw-semibold">
                {t('bulk.selected', { count: selectedNotes.size })}
              </span>

              <CDropdown>
                <CDropdownToggle color="light" size="sm" disabled={bulkLoading}>
                  {t('bulk.changeStatus')}
                </CDropdownToggle>
                <CDropdownMenu>
                  {['draft', 'requires_action', 'completed', 'archived'].map((status) => (
                    <CDropdownItem key={status} onClick={() => handleBulkStatus(status)}>
                      <CBadge color={statusColors[status]} className="me-2">{tCommon(`noteStatus.${status}`)}</CBadge>
                    </CDropdownItem>
                  ))}
                </CDropdownMenu>
              </CDropdown>

              <CDropdown>
                <CDropdownToggle color="light" size="sm" disabled={bulkLoading}>
                  {t('bulk.changePriority')}
                </CDropdownToggle>
                <CDropdownMenu>
                  {['low', 'medium', 'high'].map((priority) => (
                    <CDropdownItem key={priority} onClick={() => handleBulkPriority(priority)}>
                      <CBadge color={priorityColors[priority]} className="me-2">{tCommon(`priority.${priority}`)}</CBadge>
                    </CDropdownItem>
                  ))}
                </CDropdownMenu>
              </CDropdown>

              {tags.length > 0 && (
                <CDropdown>
                  <CDropdownToggle color="light" size="sm" disabled={bulkLoading}>
                    {t('bulk.addTag')}
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
                {t('bulk.delete')}
              </CButton>

              <CButton
                color="light"
                size="sm"
                onClick={() => setSelectedNotes(new Set())}
                className="ms-auto"
              >
                <CIcon icon={cilX} className="me-1" />
                {t('bulk.cancelSelection')}
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
              <div className="empty-state__title">{t('noCustomers')}</div>
              <div className="empty-state__description">
                {t('noCustomersDescription')}
              </div>
              <CButton color="primary" onClick={() => navigate('/customers')}>
                <CIcon icon={cilPlus} className="me-2" />
                {tCommon('actions.addCustomer')}
              </CButton>
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CIcon icon={cilNotes} size="3xl" />
              </div>
              <div className="empty-state__title">{t('noNotes')}</div>
              <div className="empty-state__description">
                {t('noNotesDescription')}
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
              tableFilterLabel={tCommon('table.filter')}
              tableFilterPlaceholder={tCommon('table.filterPlaceholder')}
              noItemsLabel={t('noNotes')}
              itemsPerPageLabel={tCommon('table.itemsPerPage')}
              defaultSort={{ key: 'created_at', direction: 'desc' }}
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
          <CModalTitle>{t('delete.title')}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {t('delete.confirm')} <strong>{deleteModal.note?.title}</strong>?
          <br />
          <small className="text-danger">
            {t('delete.warning')}
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteModal({ show: false, note: null })}
          >
            {tCommon('actions.cancel')}
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            {tCommon('actions.delete')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Potvrzení hromadného smazání */}
      <CModal
        visible={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
      >
        <CModalHeader>
          <CModalTitle>{t('bulk.deleteTitle')}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {t('bulk.deleteConfirm', { count: selectedNotes.size })}
          <br />
          <small className="text-danger">
            {t('bulk.deleteWarning')}
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setBulkDeleteModal(false)}
          >
            {tCommon('actions.cancel')}
          </CButton>
          <CButton color="danger" onClick={handleBulkDelete} disabled={bulkLoading}>
            {bulkLoading ? <CSpinner size="sm" /> : t('bulk.deleteAll')}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Notes
