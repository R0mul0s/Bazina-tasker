import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CCard, CCardBody, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilTask, cilCalendar } from '@coreui/icons'
import { useLocaleFormat } from '../../hooks/useLocaleFormat'

const priorityColors = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

const KanbanCard = ({ note, overlay = false }) => {
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()
  const { formatDate } = useLocaleFormat()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    data: {
      type: 'note',
      note,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e) => {
    // Prevent navigation when dragging
    if (isDragging) {
      e.preventDefault()
      return
    }
    navigate(`/notes/${note.id}?from=kanban`)
  }

  const cardContent = (
    <CCard
      className={`kanban-card ${isDragging ? 'kanban-card--dragging' : ''} ${overlay ? 'kanban-card--overlay' : ''}`}
      onClick={overlay ? undefined : handleClick}
    >
      <CCardBody className="p-2">
        {/* Title */}
        <div className="kanban-card__title fw-semibold mb-2">
          {note.title}
        </div>

        {/* Customer */}
        {note.customer && (
          <div className="kanban-card__customer text-secondary small mb-2">
            <CIcon icon={cilUser} size="sm" className="me-1" />
            {note.customer.name}
            {note.customer.company && (
              <span className="text-body-tertiary"> - {note.customer.company}</span>
            )}
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="kanban-card__tags d-flex flex-wrap gap-1 mb-2">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className={`tag-badge tag-badge--${tag.color || 'gray'} tag-badge--sm`}
              >
                {tag.name}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="tag-badge tag-badge--gray tag-badge--sm">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer - Priority, Tasks, Date */}
        <div className="kanban-card__footer d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <CBadge color={priorityColors[note.priority]} size="sm">
              {tCommon(`priority.${note.priority}`)}
            </CBadge>

            {note.tasks_total > 0 && (
              <span className="text-secondary small d-flex align-items-center gap-1">
                <CIcon icon={cilTask} size="sm" />
                {note.tasks_completed}/{note.tasks_total}
              </span>
            )}
          </div>

          {note.meeting_date && (
            <span className="text-secondary small d-flex align-items-center gap-1">
              <CIcon icon={cilCalendar} size="sm" />
              {formatDate(note.meeting_date)}
            </span>
          )}
        </div>
      </CCardBody>
    </CCard>
  )

  if (overlay) {
    return cardContent
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {cardContent}
    </div>
  )
}

export default KanbanCard
