import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormCheck,
  CSpinner,
  CAlert,
  CRow,
  CCol,
  CBadge,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBold,
  cilItalic,
  cilListNumbered,
  cilList,
  cilPlus,
  cilTrash,
} from '@coreui/icons'

// Typy schůzek (musí odpovídat DB enum: in_person, phone, video, email)
const MEETING_TYPES = [
  { value: 'phone', label: 'Telefonát' },
  { value: 'video', label: 'Video hovor' },
  { value: 'in_person', label: 'Osobní schůzka' },
  { value: 'email', label: 'Email' },
]

// Stavy poznámky
const NOTE_STATUSES = [
  { value: 'draft', label: 'Koncept' },
  { value: 'requires_action', label: 'Vyžaduje akci' },
  { value: 'completed', label: 'Dokončeno' },
  { value: 'archived', label: 'Archivováno' },
]

// Priority
const PRIORITIES = [
  { value: 'low', label: 'Nízká', color: 'success' },
  { value: 'medium', label: 'Střední', color: 'warning' },
  { value: 'high', label: 'Vysoká', color: 'danger' },
]

// TipTap Toolbar
const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="tiptap-toolbar border-bottom p-2 d-flex gap-1 flex-wrap">
      <CButton
        color={editor.isActive('bold') ? 'primary' : 'light'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Tučné"
      >
        <CIcon icon={cilBold} />
      </CButton>
      <CButton
        color={editor.isActive('italic') ? 'primary' : 'light'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Kurzíva"
      >
        <CIcon icon={cilItalic} />
      </CButton>
      <CButton
        color={editor.isActive('bulletList') ? 'primary' : 'light'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Odrážkový seznam"
      >
        <CIcon icon={cilList} />
      </CButton>
      <CButton
        color={editor.isActive('orderedList') ? 'primary' : 'light'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Číslovaný seznam"
      >
        <CIcon icon={cilListNumbered} />
      </CButton>
    </div>
  )
}

const NoteForm = ({
  visible,
  onClose,
  onSave,
  note = null,
  customers = [],
  tags = [],
  preselectedCustomerId = null,
}) => {
  const isEditing = !!note

  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    meeting_type: 'phone',
    meeting_date: '',
    priority: 'medium',
    status: 'draft',
    follow_up_date: '',
  })
  const [selectedTags, setSelectedTags] = useState([])
  const [tasks, setTasks] = useState([])
  const [newTaskText, setNewTaskText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor p-3',
        style: 'min-height: 150px; outline: none;',
      },
    },
  })

  // Načtení dat při editaci
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        customer_id: note.customer_id || '',
        meeting_type: note.meeting_type || 'phone',
        meeting_date: note.meeting_date ? note.meeting_date.split('T')[0] : '',
        priority: note.priority || 'medium',
        status: note.status || 'draft',
        follow_up_date: note.follow_up_date ? note.follow_up_date.split('T')[0] : '',
      })
      setSelectedTags(note.tags?.map((t) => t.id) || [])
      setTasks(note.tasks || [])
      if (editor) {
        editor.commands.setContent(note.content || '')
      }
    } else {
      setFormData({
        title: '',
        customer_id: preselectedCustomerId || '',
        meeting_type: 'phone',
        meeting_date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        status: 'draft',
        follow_up_date: '',
      })
      setSelectedTags([])
      setTasks([])
      if (editor) {
        editor.commands.setContent('')
      }
    }
    setError('')
    setNewTaskText('')
  }, [note, visible, preselectedCustomerId, editor])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagToggle = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleAddTask = () => {
    if (!newTaskText.trim()) return
    setTasks((prev) => [
      ...prev,
      { text: newTaskText.trim(), is_completed: false, id: `new-${Date.now()}` },
    ])
    setNewTaskText('')
  }

  const handleRemoveTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTaskToggle = (index) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, is_completed: !task.is_completed } : task
      )
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Název poznámky je povinný')
      return
    }

    if (!formData.customer_id) {
      setError('Vyberte zákazníka')
      return
    }

    setLoading(true)

    // Konverze prázdných stringů na null pro datumová pole
    const noteData = {
      ...formData,
      follow_up_date: formData.follow_up_date || null,
      meeting_date: formData.meeting_date || null,
      content: editor?.getHTML() || '',
      tasks: tasks.map((t, i) => ({
        text: t.text,
        is_completed: t.is_completed,
        order: i,
      })),
    }

    const result = await onSave(noteData, selectedTags, note?.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      onClose()
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="xl">
      <CModalHeader>
        <CModalTitle>{isEditing ? 'Upravit poznámku' : 'Nová poznámka'}</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError('')}>
              {error}
            </CAlert>
          )}

          <CRow className="mb-3">
            <CCol md={8}>
              <CFormLabel htmlFor="title">Název poznámky *</CFormLabel>
              <CFormInput
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Shrnutí schůzky..."
                required
              />
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="customer_id">Zákazník *</CFormLabel>
              <CFormSelect
                id="customer_id"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
              >
                <option value="">Vyberte zákazníka</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.company ? ` (${customer.company})` : ''}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={3}>
              <CFormLabel htmlFor="meeting_type">Typ schůzky</CFormLabel>
              <CFormSelect
                id="meeting_type"
                name="meeting_type"
                value={formData.meeting_type}
                onChange={handleChange}
              >
                {MEETING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormLabel htmlFor="meeting_date">Datum schůzky</CFormLabel>
              <CFormInput
                type="date"
                id="meeting_date"
                name="meeting_date"
                value={formData.meeting_date}
                onChange={handleChange}
              />
            </CCol>
            <CCol md={3}>
              <CFormLabel htmlFor="priority">Priorita</CFormLabel>
              <CFormSelect
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormLabel htmlFor="status">Stav</CFormLabel>
              <CFormSelect
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {NOTE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={4}>
              <CFormLabel htmlFor="follow_up_date">Follow-up datum</CFormLabel>
              <CFormInput
                type="date"
                id="follow_up_date"
                name="follow_up_date"
                value={formData.follow_up_date}
                onChange={handleChange}
              />
            </CCol>
            <CCol md={8}>
              <CFormLabel>Tagy</CFormLabel>
              <div className="d-flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <small className="text-secondary">Žádné tagy k dispozici</small>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`tag-badge tag-badge--lg tag-badge--${selectedTags.includes(tag.id) ? tag.color || 'gray' : 'gray'} cursor-pointer`}
                      style={{ opacity: selectedTags.includes(tag.id) ? 1 : 0.4 }}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </span>
                  ))
                )}
              </div>
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel>Obsah poznámky</CFormLabel>
            <div className="border rounded">
              <MenuBar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel>Úkoly</CFormLabel>
            <CInputGroup className="mb-2">
              <CFormInput
                placeholder="Přidat úkol..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTask()
                  }
                }}
              />
              <CButton color="primary" onClick={handleAddTask}>
                <CIcon icon={cilPlus} />
              </CButton>
            </CInputGroup>
            {tasks.length > 0 && (
              <div className="border rounded p-2">
                {tasks.map((task, index) => (
                  <div
                    key={task.id || index}
                    className="d-flex align-items-center justify-content-between py-1"
                  >
                    <CFormCheck
                      id={`task-${index}`}
                      label={task.text}
                      checked={task.is_completed}
                      onChange={() => handleTaskToggle(index)}
                      className={task.is_completed ? 'text-decoration-line-through text-secondary' : ''}
                    />
                    <CButton
                      color="light"
                      size="sm"
                      className="text-danger"
                      onClick={() => handleRemoveTask(index)}
                    >
                      <CIcon icon={cilTrash} size="sm" />
                    </CButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={loading}>
            Zrušit
          </CButton>
          <CButton type="submit" color="primary" disabled={loading}>
            {loading ? <CSpinner size="sm" /> : isEditing ? 'Uložit změny' : 'Vytvořit'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default NoteForm
