import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilNotes, cilUser } from '@coreui/icons'
import { useNotes } from '../../hooks/useNotes'
import { useLocaleFormat } from '../../hooks/useLocaleFormat'

const priorityColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
}

const meetingTypeColors = {
  meeting: '#3b82f6',
  phone: '#8b5cf6',
  email: '#06b6d4',
  other: '#6b7280',
}

const MEETING_TYPES = ['meeting', 'phone', 'email', 'other']

const Calendar = () => {
  const { t, i18n } = useTranslation('calendar')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()
  const { formatDate } = useLocaleFormat()
  const { notes, loading } = useNotes()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Převod poznámek na události kalendáře
  const events = useMemo(() => {
    const calendarEvents = []

    notes.forEach((note) => {
      // Schůzky (meeting_date)
      if (note.meeting_date) {
        calendarEvents.push({
          id: `meeting-${note.id}`,
          title: note.title,
          start: note.meeting_date,
          allDay: true,
          backgroundColor: meetingTypeColors[note.meeting_type] || meetingTypeColors.other,
          borderColor: meetingTypeColors[note.meeting_type] || meetingTypeColors.other,
          extendedProps: {
            type: 'meeting',
            note: note,
          },
        })
      }

      // Follow-upy
      if (note.follow_up_date) {
        calendarEvents.push({
          id: `followup-${note.id}`,
          title: `📌 ${note.title}`,
          start: note.follow_up_date,
          allDay: true,
          backgroundColor: priorityColors[note.priority] || priorityColors.medium,
          borderColor: priorityColors[note.priority] || priorityColors.medium,
          extendedProps: {
            type: 'followup',
            note: note,
          },
        })
      }
    })

    return calendarEvents
  }, [notes])

  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      ...clickInfo.event.extendedProps,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
    })
    setModalVisible(true)
  }

  const handleDateClick = (arg) => {
    // Přesměrovat na vytvoření nové poznámky s předvyplněným datem
    navigate(`/notes?date=${arg.dateStr}`)
  }

  const goToNote = () => {
    if (selectedEvent?.note?.id) {
      navigate(`/notes/${selectedEvent.note.id}`)
      setModalVisible(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <CIcon icon={cilCalendar} className="me-2" />
          {t('title')}
        </h2>
      </div>

      <CCard className="mb-4">
        <CCardBody className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            locale={i18n.language}
            firstDay={1}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            buttonText={{
              today: t('buttons.today'),
              month: t('buttons.month'),
              week: t('buttons.week'),
            }}
            dayMaxEvents={3}
            moreLinkText={(n) => t('moreEvents', { count: n })}
          />
        </CCardBody>
      </CCard>

      {/* Legenda */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>{t('legend.title')}</strong>
        </CCardHeader>
        <CCardBody>
          <div className="d-flex flex-wrap gap-4">
            <div>
              <strong className="d-block mb-2">{t('legend.meetingType')}</strong>
              <div className="d-flex flex-wrap gap-2">
                {MEETING_TYPES.map((type) => (
                  <CBadge
                    key={type}
                    style={{ backgroundColor: meetingTypeColors[type] }}
                  >
                    {t(`legend.${type}`)}
                  </CBadge>
                ))}
              </div>
            </div>
            <div>
              <strong className="d-block mb-2">{t('legend.followUpPriority')}</strong>
              <div className="d-flex flex-wrap gap-2">
                <CBadge style={{ backgroundColor: priorityColors.low }}>📌 {tCommon('priority.low')}</CBadge>
                <CBadge style={{ backgroundColor: priorityColors.medium }}>📌 {tCommon('priority.medium')}</CBadge>
                <CBadge style={{ backgroundColor: priorityColors.high }}>📌 {tCommon('priority.high')}</CBadge>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Modal s detailem události */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>
            {selectedEvent?.type === 'followup' ? t('modal.followUp') : t('modal.meeting')}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedEvent && (
            <div>
              <h5 className="mb-3">{selectedEvent.note?.title}</h5>

              <div className="mb-2">
                <CIcon icon={cilCalendar} className="me-2 text-secondary" />
                <strong>{t('modal.date')}</strong>{' '}
                {selectedEvent.start && formatDate(selectedEvent.start)}
              </div>

              {selectedEvent.note?.customer && (
                <div className="mb-2">
                  <CIcon icon={cilUser} className="me-2 text-secondary" />
                  <strong>{t('modal.customer')}</strong>{' '}
                  {selectedEvent.note.customer.name || selectedEvent.note.customer.company}
                </div>
              )}

              {selectedEvent.type === 'meeting' && selectedEvent.note?.meeting_type && (
                <div className="mb-2">
                  <CIcon icon={cilNotes} className="me-2 text-secondary" />
                  <strong>{t('modal.type')}</strong>{' '}
                  {tCommon(`meetingType.${selectedEvent.note.meeting_type}`)}
                </div>
              )}

              {selectedEvent.note?.priority && (
                <div className="mb-2">
                  <strong>{t('modal.priority')}</strong>{' '}
                  <CBadge
                    style={{ backgroundColor: priorityColors[selectedEvent.note.priority] }}
                  >
                    {tCommon(`priority.${selectedEvent.note.priority}`)}
                  </CBadge>
                </div>
              )}
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            {tCommon('actions.close')}
          </CButton>
          <CButton color="primary" onClick={goToNote}>
            {t('modal.viewNote')}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Calendar
