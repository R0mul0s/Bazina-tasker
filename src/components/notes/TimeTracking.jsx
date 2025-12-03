import { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CInputGroup,
  CFormInput,
  CListGroup,
  CListGroupItem,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilClock } from '@coreui/icons'
import { useTimeEntries } from '../../hooks/useTimeEntries'
import { formatDate } from '../../lib/utils'

const TimeTracking = ({ noteId }) => {
  const {
    loading,
    fetchTimeEntries,
    addTimeEntry,
    deleteTimeEntry,
    getTotalTime,
    formatDuration,
    parseTimeInput,
  } = useTimeEntries()

  const [entries, setEntries] = useState([])
  const [timeInput, setTimeInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  // Načtení záznamů při mountu
  useEffect(() => {
    const loadEntries = async () => {
      const { data } = await fetchTimeEntries(noteId)
      setEntries(data)
    }
    if (noteId) {
      loadEntries()
    }
  }, [noteId, fetchTimeEntries])

  const handleAddTime = async () => {
    setError('')

    const minutes = parseTimeInput(timeInput)
    if (minutes <= 0) {
      setError('Zadejte platný čas (např. 30, 1h, 1h 30m)')
      return
    }

    setAdding(true)
    const { data, error: addError } = await addTimeEntry(noteId, minutes, descInput)
    setAdding(false)

    if (addError) {
      setError(addError)
      return
    }

    // Přidat do seznamu
    setEntries((prev) => [data, ...prev])
    setTimeInput('')
    setDescInput('')
  }

  const handleDelete = async (entryId) => {
    const { error: deleteError } = await deleteTimeEntry(entryId)
    if (!deleteError) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTime()
    }
  }

  const totalMinutes = getTotalTime(entries)

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <strong>
          <CIcon icon={cilClock} className="me-2" />
          Strávený čas
        </strong>
        <span className="badge bg-primary fs-6">{formatDuration(totalMinutes)}</span>
      </CCardHeader>
      <CCardBody>
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError('')} className="mb-3">
            {error}
          </CAlert>
        )}

        {/* Formulář pro přidání času */}
        <div className="mb-3">
          <div className="d-flex gap-2 mb-2">
            <CFormInput
              placeholder="Čas (např. 30, 1h, 1h 30m)"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ maxWidth: '180px' }}
            />
            <CFormInput
              placeholder="Popis činnosti (volitelné)"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow-1"
            />
            <CButton
              color="primary"
              onClick={handleAddTime}
              disabled={adding || !timeInput.trim()}
            >
              {adding ? <CSpinner size="sm" /> : <CIcon icon={cilPlus} />}
            </CButton>
          </div>
          <small className="text-secondary">
            Formáty: 30 (minuty), 1h, 1.5h, 1h 30m
          </small>
        </div>

        {/* Seznam záznamů */}
        {loading ? (
          <div className="text-center py-3">
            <CSpinner color="primary" size="sm" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center text-secondary py-3">
            Zatím žádný zaznamenaný čas
          </div>
        ) : (
          <CListGroup flush>
            {entries.map((entry) => (
              <CListGroupItem
                key={entry.id}
                className="d-flex justify-content-between align-items-center py-2"
              >
                <div>
                  <strong className="me-2">{formatDuration(entry.duration_minutes)}</strong>
                  {entry.description && (
                    <span className="text-secondary">{entry.description}</span>
                  )}
                  <small className="text-secondary ms-2">
                    ({formatDate(entry.entry_date)})
                  </small>
                </div>
                <CButton
                  color="light"
                  size="sm"
                  className="text-danger"
                  onClick={() => handleDelete(entry.id)}
                  title="Smazat"
                >
                  <CIcon icon={cilTrash} size="sm" />
                </CButton>
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
      </CCardBody>
    </CCard>
  )
}

export default TimeTracking
