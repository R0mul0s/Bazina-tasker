import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import ColumnFormModal from './ColumnFormModal'

const KanbanBoard = ({
  columns,
  notes,
  onColumnCreate,
  onColumnUpdate,
  onColumnDelete,
  onColumnsReorder,
  onNoteMove,
  loading,
}) => {
  const { t } = useTranslation('kanban')

  const [activeItem, setActiveItem] = useState(null)
  const [columnModal, setColumnModal] = useState({ visible: false, column: null })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Custom scrollbar state
  const boardRef = useRef(null)
  const [scrollState, setScrollState] = useState({ thumbWidth: 0, thumbLeft: 0, canScroll: false })
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false)
  const dragStartX = useRef(0)
  const dragStartScroll = useRef(0)

  // Update scrollbar thumb position and size
  const updateScrollbar = useCallback(() => {
    const board = boardRef.current
    if (!board) return

    const { scrollWidth, clientWidth, scrollLeft } = board
    const canScroll = scrollWidth > clientWidth

    if (canScroll) {
      const thumbWidth = Math.max((clientWidth / scrollWidth) * 100, 10)
      const maxScroll = scrollWidth - clientWidth
      const thumbLeft = maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - thumbWidth) : 0
      setScrollState({ thumbWidth, thumbLeft, canScroll: true })
    } else {
      setScrollState({ thumbWidth: 100, thumbLeft: 0, canScroll: false })
    }
  }, [])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    updateScrollbar()
    board.addEventListener('scroll', updateScrollbar)
    window.addEventListener('resize', updateScrollbar)

    return () => {
      board.removeEventListener('scroll', updateScrollbar)
      window.removeEventListener('resize', updateScrollbar)
    }
  }, [updateScrollbar, columns])

  // Handle custom scrollbar drag
  const handleScrollbarMouseDown = (e) => {
    e.preventDefault()
    setIsDraggingScrollbar(true)
    dragStartX.current = e.clientX
    dragStartScroll.current = boardRef.current?.scrollLeft || 0
  }

  useEffect(() => {
    if (!isDraggingScrollbar) return

    const handleMouseMove = (e) => {
      const board = boardRef.current
      if (!board) return

      const trackWidth = board.clientWidth
      const scrollWidth = board.scrollWidth - board.clientWidth
      const deltaX = e.clientX - dragStartX.current
      const scrollDelta = (deltaX / trackWidth) * (scrollWidth + board.clientWidth)
      board.scrollLeft = dragStartScroll.current + scrollDelta
    }

    const handleMouseUp = () => {
      setIsDraggingScrollbar(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingScrollbar])

  // Handle click on scrollbar track
  const handleTrackClick = (e) => {
    const board = boardRef.current
    if (!board || e.target !== e.currentTarget) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const trackWidth = rect.width
    const scrollWidth = board.scrollWidth - board.clientWidth
    board.scrollLeft = (clickX / trackWidth) * scrollWidth
  }

  // Group notes by column
  const notesByColumn = useMemo(() => {
    const grouped = {}
    columns.forEach((col) => {
      grouped[col.id] = []
    })
    notes.forEach((note) => {
      if (note.kanban_column_id && grouped[note.kanban_column_id]) {
        grouped[note.kanban_column_id].push(note)
      } else if (columns.length > 0) {
        // Put notes without column into default/first column
        const defaultCol = columns.find((c) => c.is_default) || columns[0]
        if (defaultCol) {
          grouped[defaultCol.id].push(note)
        }
      }
    })
    // Sort notes by kanban_order within each column
    Object.keys(grouped).forEach((colId) => {
      grouped[colId].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0))
    })
    return grouped
  }, [columns, notes])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const columnIds = useMemo(
    () => columns.map((col) => `column-${col.id}`),
    [columns]
  )

  const handleDragStart = useCallback((event) => {
    const { active } = event
    const activeData = active.data.current

    if (activeData?.type === 'column') {
      setActiveItem({ type: 'column', data: activeData.column })
    } else if (activeData?.type === 'note') {
      setActiveItem({ type: 'note', data: activeData.note })
    }
  }, [])

  const handleDragOver = useCallback((event) => {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Only handle note dragging
    if (activeData?.type !== 'note') return

    const activeNoteId = active.id
    const activeColumnId = activeData.note.kanban_column_id

    // Determine target column
    let overColumnId
    if (overData?.type === 'column') {
      overColumnId = overData.column.id
    } else if (overData?.type === 'note') {
      overColumnId = overData.note.kanban_column_id
    }

    if (!overColumnId || activeColumnId === overColumnId) return

    // Note is being dragged to a different column
    // This will be handled in handleDragEnd
  }, [])

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event
      setActiveItem(null)

      if (!over) return

      const activeData = active.data.current
      const overData = over.data.current

      // Handle column reordering
      if (activeData?.type === 'column' && overData?.type === 'column') {
        const activeColumnId = activeData.column.id
        const overColumnId = overData.column.id

        if (activeColumnId !== overColumnId) {
          const oldIndex = columns.findIndex((c) => c.id === activeColumnId)
          const newIndex = columns.findIndex((c) => c.id === overColumnId)
          const reordered = arrayMove(columns, oldIndex, newIndex)
          await onColumnsReorder(reordered)
        }
        return
      }

      // Handle note movement
      if (activeData?.type === 'note') {
        const activeNoteId = active.id
        const activeNote = activeData.note
        const activeColumnId = activeNote.kanban_column_id

        let targetColumnId
        let targetIndex = 0

        if (overData?.type === 'column') {
          // Dropped on a column
          targetColumnId = overData.column.id
          targetIndex = notesByColumn[targetColumnId]?.length || 0
        } else if (overData?.type === 'note') {
          // Dropped on another note
          const overNote = overData.note
          targetColumnId = overNote.kanban_column_id
          const columnNotes = notesByColumn[targetColumnId] || []
          targetIndex = columnNotes.findIndex((n) => n.id === overNote.id)
        }

        if (!targetColumnId) return

        // Calculate new order values
        const targetColumnNotes = notesByColumn[targetColumnId] || []
        const updates = []

        if (activeColumnId === targetColumnId) {
          // Moving within same column
          const oldIndex = targetColumnNotes.findIndex((n) => n.id === activeNoteId)
          if (oldIndex === targetIndex) return

          const reordered = arrayMove(targetColumnNotes, oldIndex, targetIndex)
          reordered.forEach((note, index) => {
            updates.push({
              id: note.id,
              kanban_column_id: targetColumnId,
              kanban_order: index,
            })
          })
        } else {
          // Moving to different column
          // Remove from old column and add to new
          const newColumnNotes = [...targetColumnNotes]
          newColumnNotes.splice(targetIndex, 0, activeNote)

          newColumnNotes.forEach((note, index) => {
            updates.push({
              id: note.id,
              kanban_column_id: targetColumnId,
              kanban_order: index,
            })
          })
        }

        if (updates.length > 0) {
          await onNoteMove(updates)
        }
      }
    },
    [columns, notesByColumn, onColumnsReorder, onNoteMove]
  )

  const handleColumnSave = async (name, columnId) => {
    if (columnId) {
      return await onColumnUpdate(columnId, { name })
    } else {
      return await onColumnCreate(name)
    }
  }

  const handleColumnDelete = async (column) => {
    const result = await onColumnDelete(column.id)
    setDeleteConfirm(null)
    return result
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board" ref={boardRef}>
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                notes={notesByColumn[column.id] || []}
                onEdit={(col) => setColumnModal({ visible: true, column: col })}
                onDelete={(col) => setDeleteConfirm(col)}
              />
            ))}
          </SortableContext>

          {/* Add column button */}
          <div className="kanban-add-column">
            <CButton
              color="light"
              className="kanban-add-column__btn"
              onClick={() => setColumnModal({ visible: true, column: null })}
            >
              <CIcon icon={cilPlus} className="me-2" />
              {t('addColumn')}
            </CButton>
          </div>
        </div>

        {/* Custom scrollbar - always visible */}
        <div
          className="kanban-board-scrollbar"
          onClick={handleTrackClick}
        >
          <div
            className="kanban-board-scrollbar__thumb"
            style={{
              width: `${scrollState.thumbWidth}%`,
              left: `${scrollState.thumbLeft}%`,
              opacity: scrollState.canScroll ? 1 : 0.3,
            }}
            onMouseDown={handleScrollbarMouseDown}
          />
        </div>

        <DragOverlay>
          {activeItem?.type === 'column' && (
            <KanbanColumn
              column={activeItem.data}
              notes={notesByColumn[activeItem.data.id] || []}
              onEdit={() => {}}
              onDelete={() => {}}
              overlay
            />
          )}
          {activeItem?.type === 'note' && (
            <KanbanCard note={activeItem.data} overlay />
          )}
        </DragOverlay>
      </DndContext>

      {/* Column form modal */}
      <ColumnFormModal
        visible={columnModal.visible}
        onClose={() => setColumnModal({ visible: false, column: null })}
        column={columnModal.column}
        onSave={handleColumnSave}
      />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('deleteColumnTitle')}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteConfirm(null)}
                />
              </div>
              <div className="modal-body">
                <p>{t('deleteColumnConfirm', { name: deleteConfirm.name })}</p>
                <p className="text-secondary small mb-0">
                  {t('deleteColumnWarning')}
                </p>
              </div>
              <div className="modal-footer">
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  {t('cancel', { ns: 'common' })}
                </CButton>
                <CButton
                  color="danger"
                  onClick={() => handleColumnDelete(deleteConfirm)}
                >
                  {t('delete', { ns: 'common' })}
                </CButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default KanbanBoard
