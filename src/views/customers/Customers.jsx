import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CButton,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
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
  cilOptions,
  cilPencil,
  cilTrash,
  cilEnvelopeClosed,
  cilPhone,
} from '@coreui/icons'
import { useCustomers } from '../../hooks/useCustomers'
import CustomerForm from '../../components/customers/CustomerForm'
import SmartTable from '../../components/common/SmartTable'
import { TableSkeleton } from '../../components/common/Skeleton'

const Customers = () => {
  const navigate = useNavigate()
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers()

  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ show: false, customer: null })

  // Definice sloupců pro SmartTable
  const columns = [
    {
      key: 'name',
      label: 'Jméno',
      _style: { width: '25%' },
    },
    {
      key: 'company',
      label: 'Firma',
      _style: { width: '25%' },
    },
    {
      key: 'contact',
      label: 'Kontakt',
      _style: { width: '35%' },
      filter: false,
      sorter: false,
    },
    {
      key: 'actions',
      label: 'Akce',
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
        <CDropdown alignment="end" popper={true}>
          <CDropdownToggle color="light" size="sm" caret={false}>
            <CIcon icon={cilOptions} />
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem onClick={() => handleEdit(item)}>
              <CIcon icon={cilPencil} className="me-2" />
              Upravit
            </CDropdownItem>
            <CDropdownItem
              className="text-danger"
              onClick={() => setDeleteModal({ show: true, customer: item })}
            >
              <CIcon icon={cilTrash} className="me-2" />
              Smazat
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
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
        <h2 className="mb-0">Zákazníci</h2>
        <CButton color="primary" onClick={() => setShowForm(true)}>
          <CIcon icon={cilPlus} className="me-2" />
          Nový zákazník
        </CButton>
      </div>

      <CCard>
        <CCardBody>
          {customers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CIcon icon={cilPeople} size="3xl" />
              </div>
              <div className="empty-state__title">Žádní zákazníci</div>
              <div className="empty-state__description">
                Přidejte prvního zákazníka kliknutím na tlačítko výše.
              </div>
              <CButton color="primary" onClick={() => setShowForm(true)}>
                <CIcon icon={cilPlus} className="me-2" />
                Přidat zákazníka
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
              tableFilterLabel="Filtr:"
              tableFilterPlaceholder="hledaný text..."
              noItemsLabel="Žádní zákazníci nenalezeni"
              itemsPerPageLabel="Položek na stránku:"
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
          <CModalTitle>Smazat zákazníka</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Opravdu chcete smazat zákazníka <strong>{deleteModal.customer?.name}</strong>?
          <br />
          <small className="text-danger">
            Tato akce smaže i všechny poznámky a přílohy tohoto zákazníka.
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteModal({ show: false, customer: null })}
          >
            Zrušit
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            Smazat
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Customers
