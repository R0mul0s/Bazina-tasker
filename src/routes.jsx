import { lazy } from 'react'

// Dashboard
const Dashboard = lazy(() => import('./views/dashboard/Dashboard'))

// Customers
const Customers = lazy(() => import('./views/customers/Customers'))
const CustomerDetail = lazy(() => import('./views/customers/CustomerDetail'))

// Notes
const Notes = lazy(() => import('./views/notes/Notes'))
const NoteDetail = lazy(() => import('./views/notes/NoteDetail'))

// Tags
const Tags = lazy(() => import('./views/tags/Tags'))

// Kanban
const Kanban = lazy(() => import('./views/kanban/Kanban'))

// Calendar
const Calendar = lazy(() => import('./views/calendar/Calendar'))

// Settings
const Settings = lazy(() => import('./views/settings/Settings'))

const routes = [
  { path: '/', exact: true, nameKey: 'routes.dashboard', element: Dashboard },

  // Customers
  { path: '/customers', nameKey: 'routes.customers', element: Customers },
  { path: '/customers/:id', nameKey: 'routes.customerDetail', element: CustomerDetail },

  // Notes
  { path: '/notes', nameKey: 'routes.notes', element: Notes },
  { path: '/notes/new', nameKey: 'routes.newNote', element: NoteDetail },
  { path: '/notes/:id', nameKey: 'routes.noteDetail', element: NoteDetail },

  // Tags
  { path: '/tags', nameKey: 'routes.tags', element: Tags },

  // Kanban
  { path: '/kanban', nameKey: 'routes.kanban', element: Kanban },

  // Calendar
  { path: '/calendar', nameKey: 'routes.calendar', element: Calendar },

  // Settings
  { path: '/settings', nameKey: 'routes.settings', element: Settings },
]

export default routes
