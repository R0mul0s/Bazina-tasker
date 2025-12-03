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

const getNavigation = (t) => [
  {
    component: CNavItem,
    name: t('menu.dashboard'),
    to: '/',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: t('menu.management'),
  },
  {
    component: CNavItem,
    name: t('menu.customers'),
    to: '/customers',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: t('menu.notes'),
    to: '/notes',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: t('menu.tags'),
    to: '/tags',
    icon: <CIcon icon={cilTags} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: t('menu.calendar'),
    to: '/calendar',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: t('menu.other'),
  },
  {
    component: CNavItem,
    name: t('menu.settings'),
    to: '/settings',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default getNavigation
