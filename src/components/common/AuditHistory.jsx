import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useAuditLog, fieldLabels } from '../../hooks/useAuditLog'
import { formatDuration } from '../../lib/utils'
import { useLocaleFormat } from '../../hooks/useLocaleFormat'

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
  const { t } = useTranslation('common')
  const { formatDateTime } = useLocaleFormat()
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
          <strong>{t('audit.title')}</strong>
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
        <strong>{t('audit.title')}</strong>
        {totalCount > 0 && (
          <CBadge color="secondary" className="ms-2">
            {logs.length} / {totalCount}
          </CBadge>
        )}
      </CCardHeader>
      <CCardBody>
        {logs.length === 0 ? (
          <div className="text-center text-secondary py-3">
            {t('audit.noHistory')}
          </div>
        ) : (
          <>
          <CAccordion flush>
            {logs.map((log, index) => (
              <CAccordionItem key={log.id} itemKey={index}>
                <CAccordionHeader>
                  <div className="d-flex align-items-center gap-2 w-100 me-3">
                    <CBadge color={actionColors[log.action]}>
                      <CIcon icon={actionIcons[log.action]} size="sm" className="me-1" />
                      {t(`audit.actions.${log.action}`)}
                    </CBadge>
                    <span className="text-secondary small">
                      {formatDateTime(log.created_at)}
                    </span>
                    {log.changed_fields && log.changed_fields.length > 0 && (
                      <span className="text-secondary small ms-auto">
                        {t('audit.fieldsChanged', { count: log.changed_fields.length })}
                      </span>
                    )}
                  </div>
                </CAccordionHeader>
                <CAccordionBody>
                  {log.action === 'UPDATE' && log.changed_fields ? (
                    <CTable small bordered className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell style={{ width: '30%' }}>{t('audit.field')}</CTableHeaderCell>
                          <CTableHeaderCell style={{ width: '35%' }}>{t('audit.oldValue')}</CTableHeaderCell>
                          <CTableHeaderCell style={{ width: '35%' }}>{t('audit.newValue')}</CTableHeaderCell>
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
                      <strong>{t('audit.messages.recordCreated')}</strong>
                      {log.new_values?.title && (
                        <div className="mt-2">
                          {t('audit.labels.title')}: {log.new_values.title}
                        </div>
                      )}
                      {log.new_values?.name && (
                        <div className="mt-2">
                          {t('audit.labels.name')}: {log.new_values.name}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'DELETE' ? (
                    <div className="text-danger">
                      <strong>{t('audit.messages.recordDeleted')}</strong>
                      {log.old_values?.title && (
                        <div className="mt-2">
                          {t('audit.labels.title')}: {log.old_values.title}
                        </div>
                      )}
                      {log.old_values?.name && (
                        <div className="mt-2">
                          {t('audit.labels.name')}: {log.old_values.name}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'attachment_added' ? (
                    <div className="text-success">
                      <strong>{t('audit.messages.attachmentUploaded')}</strong>
                      {log.new_values?.file_name && (
                        <div className="mt-2">
                          {t('audit.labels.file')}: {log.new_values.file_name}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'attachment_removed' ? (
                    <div className="text-danger">
                      <strong>{t('audit.messages.attachmentDeleted')}</strong>
                      {log.old_values?.file_name && (
                        <div className="mt-2">
                          {t('audit.labels.file')}: {log.old_values.file_name}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'task_added' ? (
                    <div className="text-success">
                      <strong>{t('audit.messages.taskAdded')}</strong>
                      {log.new_values?.task_text && (
                        <div className="mt-2">
                          {t('audit.labels.task')}: {log.new_values.task_text}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'task_removed' ? (
                    <div className="text-danger">
                      <strong>{t('audit.messages.taskRemoved')}</strong>
                      {log.old_values?.task_text && (
                        <div className="mt-2">
                          {t('audit.labels.task')}: {log.old_values.task_text}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'time_entry_added' ? (
                    <div className="text-success">
                      <strong>{t('audit.messages.timeEntryAdded')}</strong>
                      {log.new_values?.duration_minutes && (
                        <div className="mt-2">
                          {t('audit.labels.duration')}: {formatDuration(log.new_values.duration_minutes)}
                        </div>
                      )}
                      {log.new_values?.description && (
                        <div>
                          {t('audit.labels.description')}: {log.new_values.description}
                        </div>
                      )}
                    </div>
                  ) : log.action === 'time_entry_removed' ? (
                    <div className="text-danger">
                      <strong>{t('audit.messages.timeEntryRemoved')}</strong>
                      {log.old_values?.duration_minutes && (
                        <div className="mt-2">
                          {t('audit.labels.duration')}: {formatDuration(log.old_values.duration_minutes)}
                        </div>
                      )}
                      {log.old_values?.description && (
                        <div>
                          {t('audit.labels.description')}: {log.old_values.description}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-secondary">
                      {t('audit.messages.unknownAction')}
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
                    {t('audit.loading')}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilReload} className="me-2" />
                    {t('audit.loadMore', { remaining: totalCount - logs.length })}
                  </>
                )}
              </CButton>
            </div>
          )}
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default AuditHistory
