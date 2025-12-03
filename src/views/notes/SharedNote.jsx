import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CContainer,
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CBadge,
  CSpinner,
  CAlert,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCalendar,
  cilUser,
  cilBuilding,
  cilPhone,
  cilVideo,
  cilEnvelopeClosed,
  cilPeople,
  cilTask,
  cilShareAlt,
} from '@coreui/icons'
import { fetchSharedNote } from '../../hooks/useNotes'
import Logo from '../../components/common/Logo'

const SharedNote = () => {
  const { shareToken } = useParams()
  const { t } = useTranslation('notes')
  const { t: tCommon } = useTranslation('common')
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadNote = async () => {
      setLoading(true)
      const { data, error: fetchError } = await fetchSharedNote(shareToken)

      if (fetchError) {
        setError(fetchError)
      } else {
        setNote(data)
      }
      setLoading(false)
    }

    if (shareToken) {
      loadNote()
    }
  }, [shareToken])

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'in_person':
        return cilPeople
      case 'phone':
        return cilPhone
      case 'video':
        return cilVideo
      case 'email':
        return cilEnvelopeClosed
      default:
        return cilCalendar
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'requires_action':
        return 'warning'
      case 'draft':
      default:
        return 'secondary'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      case 'low':
      default:
        return 'info'
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body">
        <div className="text-center">
          <CSpinner color="primary" className="mb-3" />
          <p className="text-secondary">{tCommon('status.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={6}>
              <CCard className="text-center">
                <CCardBody className="py-5">
                  <CIcon icon={cilShareAlt} size="3xl" className="text-secondary mb-3" />
                  <h4>{t('shared.notFound')}</h4>
                  <p className="text-secondary mb-0">
                    {t('shared.notFoundDescription')}
                  </p>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-body-secondary py-4">
      <CContainer>
        {/* Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <Logo size={32} />
            <span className="fs-5 fw-semibold">Bazina Tasker</span>
          </div>
          <div className="text-secondary small">
            <CIcon icon={cilShareAlt} size="sm" className="me-1" />
            {t('shared.title')}
          </div>
        </div>

        <CRow className="justify-content-center">
          <CCol lg={8}>
            <CCard className="shadow-sm">
              <CCardHeader>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <h4 className="mb-1">{note.title}</h4>
                    {note.customer && (
                      <div className="text-secondary">
                        <CIcon icon={cilUser} size="sm" className="me-1" />
                        {note.customer.name}
                        {note.customer.company && (
                          <span className="ms-2">
                            <CIcon icon={cilBuilding} size="sm" className="me-1" />
                            {note.customer.company}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <CBadge color={getStatusColor(note.status)}>
                      {tCommon(`noteStatus.${note.status}`)}
                    </CBadge>
                    <CBadge color={getPriorityColor(note.priority)}>
                      {tCommon(`priority.${note.priority}`)}
                    </CBadge>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody>
                {/* Meta info */}
                <div className="d-flex flex-wrap gap-3 mb-4 pb-3 border-bottom">
                  {note.meeting_date && (
                    <div className="text-secondary">
                      <CIcon icon={cilCalendar} size="sm" className="me-1" />
                      {new Date(note.meeting_date).toLocaleDateString()}
                    </div>
                  )}
                  {note.meeting_type && (
                    <div className="text-secondary">
                      <CIcon icon={getMeetingTypeIcon(note.meeting_type)} size="sm" className="me-1" />
                      {tCommon(`meetingType.${note.meeting_type}`)}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="d-flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className={`tag-badge tag-badge--${tag.color || 'gray'}`}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content */}
                {note.content && (
                  <div
                    className="note-content mb-4"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                )}

                {/* Tasks */}
                {note.tasks && note.tasks.length > 0 && (
                  <div className="mt-4 pt-3 border-top">
                    <h6 className="d-flex align-items-center gap-2 mb-3">
                      <CIcon icon={cilTask} />
                      {t('shared.tasks')} ({t('detail.tasksCount', {
                        completed: note.tasks.filter((task) => task.is_completed).length,
                        total: note.tasks.length
                      })})
                    </h6>
                    <div className="sortable-task-list">
                      {note.tasks.map((task) => (
                        <div key={task.id} className="sortable-task">
                          <CFormCheck
                            id={`shared-task-${task.id}`}
                            label={task.text}
                            checked={task.is_completed}
                            disabled
                            className={task.is_completed ? 'text-decoration-line-through text-secondary' : ''}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CCardBody>
            </CCard>

            {/* Footer */}
            <div className="text-center mt-4 text-secondary small">
              <p className="mb-1">
                {t('shared.createdWith')} <strong>Bazina Tasker</strong>
              </p>
              <a
                href="/"
                className="text-primary text-decoration-none"
              >
                {t('shared.tryIt')}
              </a>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default SharedNote
