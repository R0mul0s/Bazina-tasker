import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
  cilCheckCircle,
  cilWarning,
} from '@coreui/icons'

// Typy schůzek (musí odpovídat DB enum: in_person, phone, video, email)
const MEETING_TYPES = ['phone', 'video', 'in_person', 'email']

// Stavy poznámky
const NOTE_STATUSES = ['draft', 'requires_action', 'completed', 'archived']

// Priority
const PRIORITIES = [
  { value: 'low', color: 'success' },
  { value: 'medium', color: 'warning' },
  { value: 'high', color: 'danger' },
]

// TipTap Toolbar
const MenuBar = ({ editor, t }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="tiptap-toolbar border-bottom p-2 d-flex gap-1 flex-wrap">
      <CButton
        color={editor.isActive('bold') ? 'primary' : 'light'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        title={t('editor.bold')}
      >
        <CIcon icon={cilBold} />
      </CButton>
      <CButton
        color={editor.isActive('italic') ? 'primary' : 'light'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title={t('editor.italic')}
      >
        <CIcon icon={cilItalic} />
      </CButton>
      <CButton
        color={editor.isActive('bulletList') ? 'primary' : 'light'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title={t('editor.bulletList')}
      >
        <CIcon icon={cilList} />
      </CButton>
      <CButton
        color={editor.isActive('orderedList') ? 'primary' : 'light'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title={t('editor.orderedList')}
      >
        <CIcon icon={cilListNumbered} />
      </CButton>
    </div>
  )
}

// Debounce delay for autosave (in ms)
const AUTOSAVE_DELAY = 2000

const NoteForm = ({
  visible,
  onClose,
  onSave,
  note = null,
  customers = [],
  tags = [],
  preselectedCustomerId = null,
  forceShowInKanban = false,
}) => {
  const { t } = useTranslation('notes')
  const { t: tCommon } = useTranslation('common')
  const isEditing = !!note

  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    meeting_type: 'phone',
    meeting_date: '',
    priority: 'medium',
    status: 'draft',
    follow_up_date: '',
    show_in_kanban: false,
  })
  const [selectedTags, setSelectedTags] = useState([])
  const [tasks, setTasks] = useState([])
  const [newTaskText, setNewTaskText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Autosave state: 'idle' | 'saving' | 'saved' | 'error'
  const [autosaveStatus, setAutosaveStatus] = useState('idle')
  const autosaveTimerRef = useRef(null)
  const isInitialLoadRef = useRef(true)
  const lastSavedDataRef = useRef(null)

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
    // Reset autosave state when modal opens
    isInitialLoadRef.current = true
    setAutosaveStatus('idle')

    if (note) {
      const initialFormData = {
        title: note.title || '',
        customer_id: note.customer_id || '',
        meeting_type: note.meeting_type || 'phone',
        meeting_date: note.meeting_date ? note.meeting_date.split('T')[0] : '',
        priority: note.priority || 'medium',
        status: note.status || 'draft',
        follow_up_date: note.follow_up_date ? note.follow_up_date.split('T')[0] : '',
        show_in_kanban: note.show_in_kanban || false,
      }
      const initialTags = note.tags?.map((t) => t.id) || []
      const initialTasks = note.tasks || []
      const initialContent = note.content || ''

      setFormData(initialFormData)
      setSelectedTags(initialTags)
      setTasks(initialTasks)
      if (editor) {
        editor.commands.setContent(initialContent)
      }

      // Store initial data for comparison
      lastSavedDataRef.current = {
        formData: initialFormData,
        selectedTags: initialTags,
        tasks: initialTasks,
        content: initialContent,
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
        show_in_kanban: forceShowInKanban,
      })
      setSelectedTags([])
      setTasks([])
      if (editor) {
        editor.commands.setContent('')
      }
      lastSavedDataRef.current = null
    }
    setError('')
    setNewTaskText('')

    // Mark initial load as complete after a short delay
    setTimeout(() => {
      isInitialLoadRef.current = false
    }, 100)
  }, [note, visible, preselectedCustomerId, editor, forceShowInKanban])

  // Build current note data for autosave
  const buildNoteData = useCallback(() => {
    return {
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
  }, [formData, tasks, editor])

  // Autosave function
  const performAutosave = useCallback(async () => {
    if (!isEditing || !note?.id || isInitialLoadRef.current) return
    if (!formData.title.trim() || !formData.customer_id) return

    const currentData = {
      formData,
      selectedTags,
      tasks,
      content: editor?.getHTML() || '',
    }

    // Check if data has changed since last save
    if (lastSavedDataRef.current) {
      const hasChanges =
        JSON.stringify(currentData.formData) !== JSON.stringify(lastSavedDataRef.current.formData) ||
        JSON.stringify(currentData.selectedTags) !== JSON.stringify(lastSavedDataRef.current.selectedTags) ||
        JSON.stringify(currentData.tasks.map(t => ({ text: t.text, is_completed: t.is_completed }))) !==
          JSON.stringify(lastSavedDataRef.current.tasks.map(t => ({ text: t.text, is_completed: t.is_completed }))) ||
        currentData.content !== lastSavedDataRef.current.content

      if (!hasChanges) return
    }

    setAutosaveStatus('saving')

    const noteData = buildNoteData()
    const result = await onSave(noteData, selectedTags, note.id)

    if (result.error) {
      setAutosaveStatus('error')
    } else {
      setAutosaveStatus('saved')
      lastSavedDataRef.current = currentData
      // Reset to idle after showing "saved" for 2 seconds
      setTimeout(() => setAutosaveStatus('idle'), 2000)
    }
  }, [isEditing, note?.id, formData, selectedTags, tasks, editor, buildNoteData, onSave])

  // Autosave effect - debounced
  useEffect(() => {
    if (!isEditing || !visible || isInitialLoadRef.current) return

    // Clear previous timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    // Set new timer for autosave
    autosaveTimerRef.current = setTimeout(() => {
      performAutosave()
    }, AUTOSAVE_DELAY)

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [formData, selectedTags, tasks, editor?.getHTML(), isEditing, visible, performAutosave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

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
      setError(t('form.titleRequired'))
      return
    }

    if (!formData.customer_id) {
      setError(t('form.customerRequired'))
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

  // Render autosave status indicator
  const renderAutosaveStatus = () => {
    if (!isEditing) return null

    switch (autosaveStatus) {
      case 'saving':
        return (
          <span className="d-flex align-items-center gap-1 text-secondary small ms-3">
            <CSpinner size="sm" />
            {t('form.autosave.saving')}
          </span>
        )
      case 'saved':
        return (
          <span className="d-flex align-items-center gap-1 text-success small ms-3">
            <CIcon icon={cilCheckCircle} size="sm" />
            {t('form.autosave.saved')}
          </span>
        )
      case 'error':
        return (
          <span className="d-flex align-items-center gap-1 text-danger small ms-3">
            <CIcon icon={cilWarning} size="sm" />
            {t('form.autosave.error')}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="xl">
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center">
          {isEditing ? t('form.titleEdit') : t('form.titleNew')}
          {renderAutosaveStatus()}
        </CModalTitle>
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
              <CFormLabel htmlFor="title">{t('form.noteTitle')} *</CFormLabel>
              <CFormInput
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('form.noteTitlePlaceholder')}
                required
              />
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="customer_id">{t('form.customer')} *</CFormLabel>
              <CFormSelect
                id="customer_id"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
              >
                <option value="">{t('form.selectCustomer')}</option>
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
              <CFormLabel htmlFor="meeting_type">{t('form.meetingType')}</CFormLabel>
              <CFormSelect
                id="meeting_type"
                name="meeting_type"
                value={formData.meeting_type}
                onChange={handleChange}
              >
                {MEETING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {tCommon(`meetingType.${type}`)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormLabel htmlFor="meeting_date">{t('form.meetingDate')}</CFormLabel>
              <CFormInput
                type="date"
                id="meeting_date"
                name="meeting_date"
                value={formData.meeting_date}
                onChange={handleChange}
              />
            </CCol>
            <CCol md={3}>
              <CFormLabel htmlFor="priority">{t('form.priority')}</CFormLabel>
              <CFormSelect
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {tCommon(`priority.${p.value}`)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormLabel htmlFor="status">{t('form.status')}</CFormLabel>
              <CFormSelect
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {NOTE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {tCommon(`noteStatus.${status}`)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={4}>
              <CFormLabel htmlFor="follow_up_date">{t('form.followUpDate')}</CFormLabel>
              <CFormInput
                type="date"
                id="follow_up_date"
                name="follow_up_date"
                value={formData.follow_up_date}
                onChange={handleChange}
              />
            </CCol>
            <CCol md={2} className="d-flex align-items-end">
              <CFormCheck
                id="show_in_kanban"
                name="show_in_kanban"
                label={t('form.showInKanban')}
                checked={formData.show_in_kanban || forceShowInKanban}
                onChange={(e) => setFormData(prev => ({ ...prev, show_in_kanban: e.target.checked }))}
                disabled={forceShowInKanban}
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{t('form.tags')}</CFormLabel>
              <div className="d-flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <small className="text-secondary">{t('form.noTags')}</small>
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
            <CFormLabel>{t('form.content')}</CFormLabel>
            <div className="border rounded">
              <MenuBar editor={editor} t={t} />
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel>{t('form.tasks')}</CFormLabel>
            <CInputGroup className="mb-2">
              <CFormInput
                placeholder={t('form.addTask')}
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
            {tCommon('actions.cancel')}
          </CButton>
          <CButton type="submit" color="primary" disabled={loading}>
            {loading ? <CSpinner size="sm" /> : isEditing ? t('form.saveChanges') : tCommon('actions.create')}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default NoteForm
