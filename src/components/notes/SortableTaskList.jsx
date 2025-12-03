import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CFormCheck } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu } from '@coreui/icons'
import { useTaskReorder } from '../../hooks/useTaskReorder'

// Jednotlivý sortable task item
const SortableTaskItem = ({ task, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-task ${isDragging ? 'sortable-task--dragging' : ''}`}
    >
      <div
        className="sortable-task__handle"
        {...attributes}
        {...listeners}
      >
        <CIcon icon={cilMenu} />
      </div>
      <CFormCheck
        id={`task-${task.id}`}
        label={task.text}
        checked={task.is_completed}
        onChange={() => onToggle(task.id, task.is_completed)}
        className={task.is_completed ? 'text-decoration-line-through text-secondary' : ''}
      />
    </div>
  )
}

const SortableTaskList = ({ tasks, onToggle, onReorder }) => {
  const { reorderTasks } = useTaskReorder()
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === over.id)

      // Přesunout úkoly a aktualizovat order property
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex)
      const newTasks = reorderedTasks.map((task, index) => ({
        ...task,
        order: index,
      }))

      // Nejprve aktualizovat parent stav (optimistická aktualizace)
      if (onReorder) {
        onReorder(newTasks)
      }

      // Pak uložit do databáze
      const { error } = await reorderTasks(newTasks)

      if (error) {
        // Při chybě vrátit původní pořadí
        if (onReorder) {
          onReorder(tasks)
        }
        console.error('Chyba při ukládání pořadí:', error)
      }
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="sortable-task-list">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeTask ? (
          <div className="sortable-task sortable-task--overlay">
            <div className="sortable-task__handle">
              <CIcon icon={cilMenu} />
            </div>
            <CFormCheck
              label={activeTask.text}
              checked={activeTask.is_completed}
              disabled
              className={activeTask.is_completed ? 'text-decoration-line-through text-secondary' : ''}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default SortableTaskList
