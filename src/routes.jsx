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

// Calendar
const Calendar = lazy(() => import('./views/calendar/Calendar'))

// Settings
const Settings = lazy(() => import('./views/settings/Settings'))

const routes = [
  { path: '/', exact: true, name: 'Dashboard', element: Dashboard },

  // Customers
  { path: '/customers', name: 'Zákazníci', element: Customers },
  { path: '/customers/:id', name: 'Detail zákazníka', element: CustomerDetail },

  // Notes
  { path: '/notes', name: 'Poznámky', element: Notes },
  { path: '/notes/new', name: 'Nová poznámka', element: NoteDetail },
  { path: '/notes/:id', name: 'Detail poznámky', element: NoteDetail },

  // Tags
  { path: '/tags', name: 'Tagy', element: Tags },

  // Calendar
  { path: '/calendar', name: 'Kalendář', element: Calendar },

  // Settings
  { path: '/settings', name: 'Nastavení', element: Settings },
]

export default routes
