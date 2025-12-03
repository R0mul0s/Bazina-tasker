import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CInputGroup,
  CFormInput,
  CInputGroupText,
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
  cilSearch,
  cilOptions,
  cilPencil,
  cilTrash,
  cilEnvelopeClosed,
  cilPhone,
} from '@coreui/icons'
import { useCustomers } from '../../hooks/useCustomers'
import CustomerForm from '../../components/customers/CustomerForm'
import { TableSkeleton } from '../../components/common/Skeleton'

const Customers = () => {
  const navigate = useNavigate()
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers()

  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteModal, setDeleteModal] = useState({ show: false, customer: null })

  // Filtrování zákazníků podle vyhledávání
  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.company?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    )
  })

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
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Seznam zákazníků ({filteredCustomers.length})</strong>
          <CInputGroup style={{ maxWidth: '300px' }}>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Hledat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CInputGroup>
        </CCardHeader>
        <CCardBody>
          {filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CIcon icon={cilPeople} size="3xl" />
              </div>
              <div className="empty-state__title">
                {searchQuery ? 'Žádní zákazníci nenalezeni' : 'Žádní zákazníci'}
              </div>
              <div className="empty-state__description">
                {searchQuery
                  ? 'Zkuste upravit vyhledávání.'
                  : 'Přidejte prvního zákazníka kliknutím na tlačítko výše.'}
              </div>
              {!searchQuery && (
                <CButton color="primary" onClick={() => setShowForm(true)}>
                  <CIcon icon={cilPlus} className="me-2" />
                  Přidat zákazníka
                </CButton>
              )}
            </div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Jméno</CTableHeaderCell>
                  <CTableHeaderCell>Firma</CTableHeaderCell>
                  <CTableHeaderCell>Kontakt</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '100px' }}>Akce</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredCustomers.map((customer) => (
                  <CTableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <CTableDataCell>
                      <strong>{customer.name}</strong>
                    </CTableDataCell>
                    <CTableDataCell>
                      {customer.company || <span className="text-secondary">-</span>}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex flex-column gap-1">
                        {customer.email && (
                          <small className="d-flex align-items-center gap-1">
                            <CIcon icon={cilEnvelopeClosed} size="sm" />
                            {customer.email}
                          </small>
                        )}
                        {customer.phone && (
                          <small className="d-flex align-items-center gap-1">
                            <CIcon icon={cilPhone} size="sm" />
                            {customer.phone}
                          </small>
                        )}
                        {!customer.email && !customer.phone && (
                          <span className="text-secondary">-</span>
                        )}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell onClick={(e) => e.stopPropagation()}>
                      <CDropdown alignment="end" popper={true}>
                        <CDropdownToggle color="light" size="sm" caret={false}>
                          <CIcon icon={cilOptions} />
                        </CDropdownToggle>
                        <CDropdownMenu>
                          <CDropdownItem onClick={() => handleEdit(customer)}>
                            <CIcon icon={cilPencil} className="me-2" />
                            Upravit
                          </CDropdownItem>
                          <CDropdownItem
                            className="text-danger"
                            onClick={() => setDeleteModal({ show: true, customer })}
                          >
                            <CIcon icon={cilTrash} className="me-2" />
                            Smazat
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
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
