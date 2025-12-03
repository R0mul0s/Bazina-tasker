import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CCard,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilPeople,
  cilPencil,
  cilTrash,
  cilEnvelopeClosed,
  cilPhone,
  cilCloudUpload,
} from '@coreui/icons'
import { useCustomers } from '../../hooks/useCustomers'
import CustomerForm from '../../components/customers/CustomerForm'
import CsvImportModal from '../../components/customers/CsvImportModal'
import SmartTable from '../../components/common/SmartTable'
import ActionMenu from '../../components/common/ActionMenu'
import { TableSkeleton } from '../../components/common/Skeleton'

const Customers = () => {
  const { t } = useTranslation('customers')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer, bulkCreateCustomers } = useCustomers()

  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ show: false, customer: null })
  const [showImport, setShowImport] = useState(false)

  // Definice sloupců pro SmartTable
  const columns = [
    {
      key: 'name',
      label: t('table.name'),
      _style: { width: '25%' },
    },
    {
      key: 'company',
      label: t('table.company'),
      _style: { width: '25%' },
    },
    {
      key: 'contact',
      label: t('table.contact'),
      _style: { width: '35%' },
      filter: false,
      sorter: false,
    },
    {
      key: 'actions',
      label: t('table.actions'),
      _style: { width: '80px' },
      filter: false,
      sorter: false,
    },
  ]

  // Custom renderování sloupců
  const scopedSlots = {
    name: (item) => <strong>{item.name}</strong>,
    company: (item) => item.company || <span className="text-secondary">-</span>,
    contact: (item) => (
      <div className="d-flex flex-column gap-1">
        {item.email && (
          <small className="d-flex align-items-center gap-1">
            <CIcon icon={cilEnvelopeClosed} size="sm" />
            {item.email}
          </small>
        )}
        {item.phone && (
          <small className="d-flex align-items-center gap-1">
            <CIcon icon={cilPhone} size="sm" />
            {item.phone}
          </small>
        )}
        {!item.email && !item.phone && <span className="text-secondary">-</span>}
      </div>
    ),
    actions: (item) => (
      <div onClick={(e) => e.stopPropagation()}>
        <ActionMenu
          actions={[
            {
              icon: cilPencil,
              label: tCommon('actions.edit'),
              onClick: () => handleEdit(item),
            },
            {
              icon: cilTrash,
              label: tCommon('actions.delete'),
              onClick: () => setDeleteModal({ show: true, customer: item }),
              danger: true,
            },
          ]}
          iconsOnly
          breakpoint="lg"
        />
      </div>
    ),
  }

  const handleSave = async (data, customerId) => {
    if (customerId) {
      return await updateCustomer(customerId, data)
    } else {
      return await createCustomer(data)
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (deleteModal.customer) {
      await deleteCustomer(deleteModal.customer.id)
      setDeleteModal({ show: false, customer: null })
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCustomer(null)
  }

  if (loading) {
    return <TableSkeleton rows={5} cols={4} />
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{t('title')}</h2>
        <div className="d-flex gap-2">
          <CButton color="secondary" variant="outline" onClick={() => setShowImport(true)}>
            <CIcon icon={cilCloudUpload} className="me-2" />
            {t('importCsv')}
          </CButton>
          <CButton color="primary" onClick={() => setShowForm(true)}>
            <CIcon icon={cilPlus} className="me-2" />
            {t('newCustomer')}
          </CButton>
        </div>
      </div>

      <CCard>
        <CCardBody>
          {customers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CIcon icon={cilPeople} size="3xl" />
              </div>
              <div className="empty-state__title">{t('empty.title')}</div>
              <div className="empty-state__description">
                {t('empty.description')}
              </div>
              <CButton color="primary" onClick={() => setShowForm(true)}>
                <CIcon icon={cilPlus} className="me-2" />
                {t('addCustomer')}
              </CButton>
            </div>
          ) : (
            <SmartTable
              items={customers}
              columns={columns}
              columnFilter
              tableFilter
              sorter
              pagination
              itemsPerPage={10}
              itemsPerPageOptions={[5, 10, 20, 50]}
              scopedSlots={scopedSlots}
              onRowClick={(item) => navigate(`/customers/${item.id}`)}
              tableFilterLabel={tCommon('table.filter')}
              tableFilterPlaceholder={tCommon('table.filterPlaceholder')}
              noItemsLabel={t('noCustomersFound')}
              itemsPerPageLabel={tCommon('table.itemsPerPage')}
            />
          )}
        </CCardBody>
      </CCard>

      {/* Formulář pro vytvoření/úpravu */}
      <CustomerForm
        visible={showForm}
        onClose={handleCloseForm}
        onSave={handleSave}
        customer={editingCustomer}
      />

      {/* Potvrzení smazání */}
      <CModal
        visible={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, customer: null })}
      >
        <CModalHeader>
          <CModalTitle>{t('delete.title')}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {t('delete.confirm', { name: deleteModal.customer?.name })}
          <br />
          <small className="text-danger">
            {t('delete.warning')}
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteModal({ show: false, customer: null })}
          >
            {tCommon('actions.cancel')}
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            {tCommon('actions.delete')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* CSV Import */}
      <CsvImportModal
        visible={showImport}
        onClose={() => setShowImport(false)}
        onImport={bulkCreateCustomers}
      />
    </>
  )
}

export default Customers
