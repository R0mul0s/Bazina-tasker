import { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilHistory, cilPlus, cilPencil, cilTrash, cilCloudUpload, cilTask, cilClock, cilReload } from '@coreui/icons'
import { useAuditLog, tableNameLabels, actionLabels, fieldLabels } from '../../hooks/useAuditLog'
import { formatDateTime, formatDuration } from '../../lib/utils'

const actionIcons = {
  INSERT: cilPlus,
  UPDATE: cilPencil,
  DELETE: cilTrash,
  attachment_added: cilCloudUpload,
  attachment_removed: cilCloudUpload,
  task_added: cilTask,
  task_removed: cilTask,
  time_entry_added: cilClock,
  time_entry_removed: cilClock,
}

const actionColors = {
  INSERT: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  attachment_added: 'success',
  attachment_removed: 'danger',
  task_added: 'success',
  task_removed: 'danger',
  time_entry_added: 'success',
  time_entry_removed: 'danger',
}

const AuditHistory = ({ tableName, recordId }) => {
  const { logs, loading, loadingMore, hasMore, totalCount, fetchLogsForRecord, loadMore, formatChanges } = useAuditLog()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (tableName && recordId && !isLoaded) {
      fetchLogsForRecord(tableName, recordId).then(() => setIsLoaded(true))
    }
  }, [tableName, recordId, fetchLogsForRecord, isLoaded])

  const handleLoadMore = () => {
    loadMore()
  }

  if (loading && !isLoaded) {
    return (
      <CCard className="mb-4">
        <CCardHeader>
          <CIcon icon={cilHistory} className="me-2" />
          <strong>Historie změn</strong>
        </CCardHeader>
        <CCardBody className="text-center py-4">
          <CSpinner size="sm" />
        </CCardBody>
      </CCard>
    )
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <CIcon icon={cilHistory} className="me-2" />
        <strong>Historie změn</strong>
        {totalCount > 0 && (
          <CBadge color="secondary" className="ms-2">
            {logs.length} / {totalCount}
          </CBadge>
        )}
      </CCardHeader>
      <CCardBody>
        {logs.length === 0 ? (
          <div className="text-center text-secondary py-3">
            Žádná historie změn
          </div>
        ) : (
          <CAccordion flush>
            {logs.map((log, index) => (
              <CAccordionItem key={log.id} itemKey={index}>
                <CAccordionHeader>
                  <div className="d-flex align-items-center gap-2 w-100 me-3">
                    <CBadge color={actionColors[log.action]}>
                      <CIcon icon={actionIcons[log.action]} size="sm" className="me-1" />
                      {actionLabels[log.action]}
                    </CBadge>
                    <span className="text-secondary small">
                      {formatDateTime(log.created_at)}
                    </span>
                    {log.changed_fields && log.changed_fields.length > 0 && (
                      <span className="text-secondary small ms-auto">
                        {log.changed_fields.length} {log.changed_fields.length === 1 ? 'pole' : 'polí'}
                      </span>
                    )}
                  </div>
                </CAccordionHeader>
                <CAccordionBody>
                  {log.action === 'UPDATE' && log.changed_fields ? (
                    <CTable small bordered className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell style={{ width: '30%' }}>Pole</CTableHeaderCell>
                          <CTableHeaderCell style={{ width: '35%' }}>Původní hodnota</CTableHeaderCell>
                          <CTableHeaderCell style={{ width: '35%' }}>Nová hodnota</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {formatChanges(log).map((change, i) => (
                          <CTableRow key={i}>
                            <CTableDataCell className="fw-medium">
                              {fieldLabels[change.field] || change.field}
                            </CTableDataCell>
                            <CTableDataCell className="text-danger">
                              <del>{change.oldValue}</del>
                            </CTableDataCell>
                            <CTableDataCell className="text-success">
                              {change.newValue}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  ) : log.action === 'INSERT' ? (
                    <div className="text-success">
                      <strong>Záznam vytvořen</strong>
                      {log.new_values?.title && (
                        <div className="mt-2">
                          Název: {log.new_values.title}
                        </div>
                      )}
                      {log.new_values?.name && (
                        <div className="mt-2">
                          Jméno: {log.new_values.name}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'DELETE' ? (
                    <div className="text-danger">
                      <strong>Záznam smazán</strong>
                      {log.old_values?.title && (
                        <div className="mt-2">
                          Název: {log.old_values.title}
                        </div>
                      )}
                      {log.old_values?.name && (
                        <div className="mt-2">
                          Jméno: {log.old_values.name}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'attachment_added' ? (
                    <div className="text-success">
                      <strong>Příloha nahrána</strong>
                      {log.new_values?.file_name && (
                        <div className="mt-2">
                          Soubor: {log.new_values.file_name}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'attachment_removed' ? (
                    <div className="text-danger">
                      <strong>Příloha smazána</strong>
                      {log.old_values?.file_name && (
                        <div className="mt-2">
                          Soubor: {log.old_values.file_name}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'task_added' ? (
                    <div className="text-success">
                      <strong>Úkol přidán</strong>
                      {log.new_values?.task_text && (
                        <div className="mt-2">
                          Úkol: {log.new_values.task_text}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'task_removed' ? (
                    <div className="text-danger">
                      <strong>Úkol odebrán</strong>
                      {log.old_values?.task_text && (
                        <div className="mt-2">
                          Úkol: {log.old_values.task_text}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'time_entry_added' ? (
                    <div className="text-success">
                      <strong>Časový záznam přidán</strong>
                      {log.new_values?.duration_minutes && (
                        <div className="mt-2">
                          Délka: {formatDuration(log.new_values.duration_minutes)}
                        </div>
                      )}
                      {log.new_values?.description && (
                        <div>
                          Popis: {log.new_values.description}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'time_entry_removed' ? (
                    <div className="text-danger">
                      <strong>Časový záznam odebrán</strong>
                      {log.old_values?.duration_minutes && (
                        <div className="mt-2">
                          Délka: {formatDuration(log.old_values.duration_minutes)}
                        </div>
                      )}
                      {log.old_values?.description && (
                        <div>
                          Popis: {log.old_values.description}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-secondary">
                      Neznámá akce
                    </div>
                  )}
                </CAccordionBody>
              </CAccordionItem>
            ))}
          </CAccordion>
          {hasMore && (
            <div className="text-center mt-3">
              <CButton
                color="secondary"
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Načítám...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilReload} className="me-2" />
                    Načíst další ({totalCount - logs.length} zbývá)
                  </>
                )}
              </CButton>
            </div>
          )}
        )}
      </CCardBody>
    </CCard>
  )
}

export default AuditHistory
