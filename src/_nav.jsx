import { CNavItem, CNavTitle } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPeople,
  cilNotes,
  cilTags,
  cilCalendar,
  cilSettings,
} from '@coreui/icons'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Správa',
  },
  {
    component: CNavItem,
    name: 'Zákazníci',
    to: '/customers',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Poznámky',
    to: '/notes',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Tagy',
    to: '/tags',
    icon: <CIcon icon={cilTags} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Kalendář',
    to: '/calendar',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Ostatní',
  },
  {
    component: CNavItem,
    name: 'Nastavení',
    to: '/settings',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default _nav
