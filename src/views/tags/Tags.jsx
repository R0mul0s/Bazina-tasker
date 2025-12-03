import { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CRow,
  CCol,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTags, cilPencil, cilTrash } from '@coreui/icons'
import { useTags } from '../../hooks/useTags'
import TagForm from '../../components/tags/TagForm'

const Tags = () => {
  const { tags, loading, createTag, updateTag, deleteTag } = useTags()

  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ show: false, tag: null })

  const handleSave = async (data, tagId) => {
    if (tagId) {
      return await updateTag(tagId, data)
    } else {
      return await createTag(data)
    }
  }

  const handleEdit = (tag) => {
    setEditingTag(tag)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (deleteModal.tag) {
      await deleteTag(deleteModal.tag.id)
      setDeleteModal({ show: false, tag: null })
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTag(null)
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
        <h2 className="mb-0">Tagy</h2>
        <CButton color="primary" onClick={() => setShowForm(true)}>
          <CIcon icon={cilPlus} className="me-2" />
          Nový tag
        </CButton>
      </div>

      <CCard>
        <CCardHeader>
          <strong>Seznam tagů ({tags.length})</strong>
        </CCardHeader>
        <CCardBody>
          {tags.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CIcon icon={cilTags} size="3xl" />
              </div>
              <div className="empty-state__title">Žádné tagy</div>
              <div className="empty-state__description">
                Zatím nemáte žádné tagy. Vytvořte tagy pro lepší organizaci poznámek.
              </div>
              <CButton color="primary" onClick={() => setShowForm(true)}>
                <CIcon icon={cilPlus} className="me-2" />
                Vytvořit tag
              </CButton>
            </div>
          ) : (
            <CRow className="g-3">
              {tags.map((tag) => (
                <CCol xs={12} sm={6} md={4} lg={3} key={tag.id}>
                  <div className="tag-card p-3 border rounded d-flex justify-content-between align-items-center">
                    <span className={`tag-badge tag-badge--lg tag-badge--${tag.color || 'gray'}`}>
                      {tag.name}
                    </span>
                    <div className="d-flex gap-1">
                      <CButton
                        color="light"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                        title="Upravit"
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="light"
                        size="sm"
                        className="text-danger"
                        onClick={() => setDeleteModal({ show: true, tag })}
                        title="Smazat"
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </div>
                  </div>
                </CCol>
              ))}
            </CRow>
          )}
        </CCardBody>
      </CCard>

      {/* Formulář pro vytvoření/úpravu */}
      <TagForm
        visible={showForm}
        onClose={handleCloseForm}
        onSave={handleSave}
        tag={editingTag}
      />

      {/* Potvrzení smazání */}
      <CModal
        visible={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, tag: null })}
      >
        <CModalHeader>
          <CModalTitle>Smazat tag</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Opravdu chcete smazat tag{' '}
          <span className={`tag-badge tag-badge--${deleteModal.tag?.color || 'gray'}`}>
            {deleteModal.tag?.name}
          </span>
          ?
          <br />
          <small className="text-secondary">
            Tag bude odebrán ze všech poznámek, ale poznámky zůstanou zachovány.
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteModal({ show: false, tag: null })}
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

export default Tags
