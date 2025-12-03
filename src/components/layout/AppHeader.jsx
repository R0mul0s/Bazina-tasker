import { useNavigate } from 'react-router-dom'
import {
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavItem,
  CNavLink,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CAvatar,
  CButton,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu, cilAccountLogout, cilSettings, cilUser, cilSun, cilMoon } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getInitials } from '../../lib/utils'
import GlobalSearch from './GlobalSearch'

const AppHeader = ({ sidebarShow, setSidebarShow }) => {
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <CHeader position="sticky" className="mb-4 p-0">
      <CContainer fluid className="px-4">
        <CHeaderToggler
          onClick={() => setSidebarShow(!sidebarShow)}
          className="d-md-down-none"
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <div className="flex-grow-1 mx-3 d-none d-md-block">
          <GlobalSearch />
        </div>

        <CHeaderNav className="ms-auto align-items-center">
          <CButton
            color="link"
            className="text-secondary p-2 me-2"
            onClick={toggleTheme}
            title={isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
          >
            <CIcon icon={isDark ? cilSun : cilMoon} size="lg" />
          </CButton>
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="py-0 pe-0">
              <div className="d-flex align-items-center">
                <span className="d-none d-md-inline me-2">
                  {profile?.full_name || user?.email}
                </span>
                <CAvatar
                  color="primary"
                  textColor="white"
                  size="md"
                >
                  {getInitials(profile?.full_name || user?.email)}
                </CAvatar>
              </div>
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                className="cursor-pointer"
                onClick={() => navigate('/settings')}
              >
                <CIcon icon={cilUser} className="me-2" />
                Profil
              </CDropdownItem>
              <CDropdownItem
                className="cursor-pointer"
                onClick={() => navigate('/settings')}
              >
                <CIcon icon={cilSettings} className="me-2" />
                Nastavení
              </CDropdownItem>
              <CDropdownDivider />
              <CDropdownItem className="cursor-pointer" onClick={handleLogout}>
                <CIcon icon={cilAccountLogout} className="me-2" />
                Odhlásit se
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CHeaderNav>
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
