import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { CCard, CCardHeader, CCardBody, CButton, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilMenu } from '@coreui/icons'
import KanbanCard from './KanbanCard'

const KanbanColumn = ({
  column,
  notes,
  onEdit,
  onDelete,
  overlay = false,
}) => {
  const { t } = useTranslation('kanban')

  const noteIds = useMemo(() => notes.map((note) => note.id), [notes])

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      column,
    },
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isColumnDragging ? 0.5 : 1,
  }

  const columnContent = (
    <CCard
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''} ${isColumnDragging ? 'kanban-column--dragging' : ''}`}
    >
      <CCardHeader className="kanban-column__header d-flex align-items-center justify-content-between py-2">
        <div className="d-flex align-items-center gap-2">
          {!overlay && (
            <div
              className="kanban-column__handle"
              {...attributes}
              {...listeners}
            >
              <CIcon icon={cilMenu} />
            </div>
          )}
          <span className="fw-semibold">{column.name}</span>
          <CBadge color="secondary" shape="rounded-pill">
            {notes.length}
          </CBadge>
          {column.is_default && (
            <CBadge color="primary" size="sm">
              {t('defaultColumn')}
            </CBadge>
          )}
        </div>
        <div className="kanban-column__actions d-flex gap-1">
          <CButton
            color="light"
            size="sm"
            className="p-1"
            onClick={() => onEdit(column)}
            title={t('editColumn')}
          >
            <CIcon icon={cilPencil} size="sm" />
          </CButton>
          {!column.is_default && (
            <CButton
              color="light"
              size="sm"
              className="p-1"
              onClick={() => onDelete(column)}
              title={t('deleteColumn')}
            >
              <CIcon icon={cilTrash} size="sm" />
            </CButton>
          )}
        </div>
      </CCardHeader>

      <CCardBody
        ref={setDroppableRef}
        className="kanban-column__body p-2"
      >
        <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
          <div className="kanban-column__cards d-flex flex-column gap-2">
            {notes.map((note) => (
              <KanbanCard key={note.id} note={note} />
            ))}
          </div>
        </SortableContext>

        {notes.length === 0 && (
          <div className="kanban-column__empty text-center text-secondary py-4">
            {t('emptyColumn')}
          </div>
        )}
      </CCardBody>
    </CCard>
  )

  if (overlay) {
    return columnContent
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="kanban-column-wrapper"
    >
      {columnContent}
    </div>
  )
}

export default KanbanColumn
