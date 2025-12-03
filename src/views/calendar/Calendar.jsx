import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { formatDate, formatDateTime } from '../../lib/utils'

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

const meetingTypeLabels = {
  meeting: 'Schůzka',
  phone: 'Telefon',
  email: 'Email',
  other: 'Ostatní',
}

const Calendar = () => {
  const navigate = useNavigate()
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
    const note = clickInfo.event.extendedProps.note
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
          Kalendář
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
            locale="cs"
            firstDay={1}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            buttonText={{
              today: 'Dnes',
              month: 'Měsíc',
              week: 'Týden',
            }}
            dayMaxEvents={3}
            moreLinkText={(n) => `+${n} dalších`}
          />
        </CCardBody>
      </CCard>

      {/* Legenda */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Legenda</strong>
        </CCardHeader>
        <CCardBody>
          <div className="d-flex flex-wrap gap-4">
            <div>
              <strong className="d-block mb-2">Typ schůzky:</strong>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(meetingTypeLabels).map(([type, label]) => (
                  <CBadge
                    key={type}
                    style={{ backgroundColor: meetingTypeColors[type] }}
                  >
                    {label}
                  </CBadge>
                ))}
              </div>
            </div>
            <div>
              <strong className="d-block mb-2">Follow-up priorita:</strong>
              <div className="d-flex flex-wrap gap-2">
                <CBadge style={{ backgroundColor: priorityColors.low }}>📌 Nízká</CBadge>
                <CBadge style={{ backgroundColor: priorityColors.medium }}>📌 Střední</CBadge>
                <CBadge style={{ backgroundColor: priorityColors.high }}>📌 Vysoká</CBadge>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Modal s detailem události */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>
            {selectedEvent?.type === 'followup' ? 'Follow-up' : 'Schůzka'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedEvent && (
            <div>
              <h5 className="mb-3">{selectedEvent.note?.title}</h5>

              <div className="mb-2">
                <CIcon icon={cilCalendar} className="me-2 text-secondary" />
                <strong>Datum:</strong>{' '}
                {selectedEvent.start && formatDate(selectedEvent.start)}
              </div>

              {selectedEvent.note?.customer && (
                <div className="mb-2">
                  <CIcon icon={cilUser} className="me-2 text-secondary" />
                  <strong>Zákazník:</strong>{' '}
                  {selectedEvent.note.customer.name || selectedEvent.note.customer.company}
                </div>
              )}

              {selectedEvent.type === 'meeting' && selectedEvent.note?.meeting_type && (
                <div className="mb-2">
                  <CIcon icon={cilNotes} className="me-2 text-secondary" />
                  <strong>Typ:</strong>{' '}
                  {meetingTypeLabels[selectedEvent.note.meeting_type]}
                </div>
              )}

              {selectedEvent.note?.priority && (
                <div className="mb-2">
                  <strong>Priorita:</strong>{' '}
                  <CBadge
                    style={{ backgroundColor: priorityColors[selectedEvent.note.priority] }}
                  >
                    {selectedEvent.note.priority === 'low'
                      ? 'Nízká'
                      : selectedEvent.note.priority === 'medium'
                        ? 'Střední'
                        : 'Vysoká'}
                  </CBadge>
                </div>
              )}
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            Zavřít
          </CButton>
          <CButton color="primary" onClick={goToNote}>
            Zobrazit poznámku
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Calendar
