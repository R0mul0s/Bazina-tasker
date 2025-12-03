import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CAlert, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { useKanbanColumns } from '../../hooks/useKanbanColumns'
import { useNotes } from '../../hooks/useNotes'
import { useCustomers } from '../../hooks/useCustomers'
import { useTags } from '../../hooks/useTags'
import KanbanBoard from '../../components/kanban/KanbanBoard'
import NoteForm from '../../components/notes/NoteForm'

const Kanban = () => {
  const { t } = useTranslation('kanban')
  const navigate = useNavigate()

  const {
    columns,
    loading: columnsLoading,
    error: columnsError,
    fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    getDefaultColumn,
  } = useKanbanColumns()

  const {
    fetchKanbanNotes,
    updateKanbanOrder,
    createNote,
  } = useNotes()

  const { customers, loading: customersLoading } = useCustomers()
  const { tags, loading: tagsLoading } = useTags()

  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNoteForm, setShowNoteForm] = useState(false)

  // Fetch kanban notes
  const loadNotes = useCallback(async () => {
    setNotesLoading(true)
    const { data, error: notesError } = await fetchKanbanNotes()
    if (notesError) {
      setError(notesError)
    } else {
      setNotes(data)
    }
    setNotesLoading(false)
  }, [fetchKanbanNotes])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Handle column creation
  const handleColumnCreate = async (name) => {
    const result = await createColumn(name)
    if (!result.error) {
      await fetchColumns()
    }
    return result
  }

  // Handle column update
  const handleColumnUpdate = async (id, updates) => {
    const result = await updateColumn(id, updates)
    return result
  }

  // Handle column deletion
  const handleColumnDelete = async (id) => {
    const result = await deleteColumn(id)
    if (!result.error) {
      // Reload notes as they may have been moved to default column
      await loadNotes()
    }
    return result
  }

  // Handle columns reorder
  const handleColumnsReorder = async (reorderedColumns) => {
    const result = await reorderColumns(reorderedColumns)
    return result
  }

  // Handle note movement between columns or reordering
  const handleNoteMove = async (updates) => {
    // Optimistic update
    setNotes((prevNotes) => {
      const updatedNotes = [...prevNotes]
      updates.forEach((update) => {
        const noteIndex = updatedNotes.findIndex((n) => n.id === update.id)
        if (noteIndex !== -1) {
          updatedNotes[noteIndex] = {
            ...updatedNotes[noteIndex],
            kanban_column_id: update.kanban_column_id,
            kanban_order: update.kanban_order,
          }
        }
      })
      return updatedNotes
    })

    // Save to database
    const { error: moveError } = await updateKanbanOrder(updates)
    if (moveError) {
      setError(moveError)
      // Revert on error
      await loadNotes()
    }
  }

  // Handle save note from form - always with show_in_kanban = true
  const handleSaveNote = async (noteData, tagIds) => {
    const defaultColumn = getDefaultColumn()
    const dataWithKanban = {
      ...noteData,
      show_in_kanban: true,
      kanban_column_id: defaultColumn?.id || null,
    }

    const result = await createNote(dataWithKanban, tagIds)

    if (!result.error && result.data?.id) {
      await loadNotes()
      navigate(`/notes/${result.data.id}`)
    }

    return result
  }

  const loading = columnsLoading || notesLoading || customersLoading || tagsLoading
  const displayError = error || columnsError

  return (
    <div className="kanban-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{t('title')}</h2>
        <CButton
          color="primary"
          onClick={() => setShowNoteForm(true)}
          disabled={customers.length === 0}
        >
          <CIcon icon={cilPlus} className="me-2" />
          {t('newNote')}
        </CButton>
      </div>

      {displayError && (
        <CAlert color="danger" dismissible onClose={() => setError(null)}>
          {displayError}
        </CAlert>
      )}

      {notes.length === 0 && !loading && (
        <CAlert color="info" className="position-relative">
          {t('noNotes')}
        </CAlert>
      )}

      <KanbanBoard
        columns={columns}
        notes={notes}
        onColumnCreate={handleColumnCreate}
        onColumnUpdate={handleColumnUpdate}
        onColumnDelete={handleColumnDelete}
        onColumnsReorder={handleColumnsReorder}
        onNoteMove={handleNoteMove}
        loading={loading}
      />

      {/* Note form modal - with show_in_kanban forced to true */}
      <NoteForm
        visible={showNoteForm}
        onClose={() => setShowNoteForm(false)}
        onSave={handleSaveNote}
        note={null}
        customers={customers}
        tags={tags}
        forceShowInKanban={true}
      />
    </div>
  )
}

export default Kanban
