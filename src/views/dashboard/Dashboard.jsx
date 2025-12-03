import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CListGroup,
  CListGroupItem,
  CBadge,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilNotes, cilCalendar, cilWarning, cilPlus } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import { useCustomers } from '../../hooks/useCustomers'
import { useNotes } from '../../hooks/useNotes'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { formatDate, formatRelativeTime } from '../../lib/utils'
import {
  NotesPerWeekChart,
  TimePerCustomerChart,
  NotesByTypeChart,
  ActivityByDayChart,
} from '../../components/dashboard/DashboardCharts'

const StatCard = ({ title, value, icon, color, onClick }) => (
  <CCard className={`mb-4 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
    <CCardBody className="d-flex align-items-center">
      <div
        className={`d-flex align-items-center justify-content-center rounded bg-${color} bg-opacity-10 me-3`}
        style={{ width: '48px', height: '48px' }}
      >
        <CIcon icon={icon} className={`text-${color}`} size="xl" />
      </div>
      <div>
        <div className="text-secondary small text-uppercase fw-semibold">
          {title}
        </div>
        <div className="fs-4 fw-semibold">{value}</div>
      </div>
    </CCardBody>
  </CCard>
)

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

const Dashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { customers, loading: customersLoading } = useCustomers()
  const { notes, loading: notesLoading, getRequiresAction, getUpcomingFollowUps } = useNotes()
  const { stats: chartStats, loading: statsLoading } = useDashboardStats()

  const loading = customersLoading || notesLoading

  const requiresActionNotes = getRequiresAction()
  const upcomingFollowUps = getUpcomingFollowUps(14) // 14 dní dopředu

  const stats = {
    customers: customers.length,
    notes: notes.length,
    followUps: upcomingFollowUps.length,
    requiresAction: requiresActionNotes.length,
  }

  // Nedávné poznámky (posledních 5)
  const recentNotes = notes.slice(0, 5)

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <h2 className="mb-4">
        Vítejte{profile?.full_name ? `, ${profile.full_name}` : ''}!
      </h2>

      <CRow>
        <CCol sm={6} xl={3}>
          <StatCard
            title="Zákazníci"
            value={stats.customers}
            icon={cilPeople}
            color="primary"
            onClick={() => navigate('/customers')}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard
            title="Poznámky"
            value={stats.notes}
            icon={cilNotes}
            color="info"
            onClick={() => navigate('/notes')}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard
            title="Nadcházející follow-upy"
            value={stats.followUps}
            icon={cilCalendar}
            color="warning"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard
            title="Vyžaduje akci"
            value={stats.requiresAction}
            icon={cilWarning}
            color="danger"
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Nedávné poznámky</strong>
              {customers.length > 0 && (
                <CButton
                  color="primary"
                  size="sm"
                  onClick={() => navigate('/notes')}
                >
                  <CIcon icon={cilPlus} className="me-1" />
                  Nová
                </CButton>
              )}
            </CCardHeader>
            <CCardBody>
              {recentNotes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">
                    <CIcon icon={cilNotes} size="3xl" />
                  </div>
                  <div className="empty-state__title">Žádné poznámky</div>
                  <div className="empty-state__description">
                    {customers.length === 0
                      ? 'Nejprve přidejte zákazníka.'
                      : 'Vytvořte první poznámku.'}
                  </div>
                  {customers.length === 0 && (
                    <CButton color="primary" onClick={() => navigate('/customers')}>
                      <CIcon icon={cilPlus} className="me-2" />
                      Přidat zákazníka
                    </CButton>
                  )}
                </div>
              ) : (
                <CListGroup flush>
                  {recentNotes.map((note) => (
                    <CListGroupItem
                      key={note.id}
                      className="d-flex justify-content-between align-items-start cursor-pointer"
                      onClick={() => navigate(`/notes/${note.id}`)}
                    >
                      <div>
                        <div className="fw-semibold">{note.title}</div>
                        <small className="text-secondary">
                          {note.customer?.name || note.customer?.company}
                          {' • '}
                          {formatRelativeTime(note.created_at)}
                        </small>
                      </div>
                      <CBadge color={priorityColors[note.priority]}>
                        {priorityLabels[note.priority]}
                      </CBadge>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Nadcházející follow-upy</strong>
            </CCardHeader>
            <CCardBody>
              {upcomingFollowUps.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">
                    <CIcon icon={cilCalendar} size="3xl" />
                  </div>
                  <div className="empty-state__title">Žádné follow-upy</div>
                  <div className="empty-state__description">
                    Nemáte naplánované žádné follow-upy na příštích 14 dní.
                  </div>
                </div>
              ) : (
                <CListGroup flush>
                  {upcomingFollowUps.slice(0, 5).map((note) => (
                    <CListGroupItem
                      key={note.id}
                      className="d-flex justify-content-between align-items-start cursor-pointer"
                      onClick={() => navigate(`/notes/${note.id}`)}
                    >
                      <div>
                        <div className="fw-semibold">{note.title}</div>
                        <small className="text-secondary">
                          {note.customer?.name || note.customer?.company}
                        </small>
                      </div>
                      <CBadge color="warning">
                        {formatDate(note.follow_up_date)}
                      </CBadge>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {requiresActionNotes.length > 0 && (
        <CRow>
          <CCol>
            <CCard className="mb-4 border-danger">
              <CCardHeader className="bg-danger text-white">
                <CIcon icon={cilWarning} className="me-2" />
                <strong>Vyžaduje akci ({requiresActionNotes.length})</strong>
              </CCardHeader>
              <CCardBody>
                <CListGroup flush>
                  {requiresActionNotes.slice(0, 5).map((note) => (
                    <CListGroupItem
                      key={note.id}
                      className="d-flex justify-content-between align-items-start cursor-pointer"
                      onClick={() => navigate(`/notes/${note.id}`)}
                    >
                      <div>
                        <div className="fw-semibold">{note.title}</div>
                        <small className="text-secondary">
                          {note.customer?.name || note.customer?.company}
                          {' • '}
                          {formatRelativeTime(note.created_at)}
                        </small>
                      </div>
                      <CBadge color={priorityColors[note.priority]}>
                        {priorityLabels[note.priority]}
                      </CBadge>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {/* Grafy statistik */}
      <h4 className="mb-3 mt-4">Statistiky</h4>
      {statsLoading ? (
        <div className="d-flex justify-content-center py-4">
          <CSpinner color="primary" size="sm" />
        </div>
      ) : (
        <CRow>
          <CCol lg={8}>
            <NotesPerWeekChart data={chartStats.notesPerWeek} />
          </CCol>
          <CCol lg={4}>
            <NotesByTypeChart data={chartStats.notesByType} />
          </CCol>
          <CCol lg={6}>
            <TimePerCustomerChart data={chartStats.timePerCustomer} />
          </CCol>
          <CCol lg={6}>
            <ActivityByDayChart data={chartStats.activityByDay} />
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default Dashboard
