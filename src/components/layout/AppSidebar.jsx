import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CSidebarToggler,
  CSidebarHeader,
} from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'
import Logo, { LogoMini } from '../common/Logo'

import getNavigation from '../../_nav'

// Breakpoint pro mobile (lg = 992px)
const MOBILE_BREAKPOINT = 992

const AppSidebar = ({ sidebarShow, setSidebarShow, unfoldable, setUnfoldable }) => {
  const { t } = useTranslation('navigation')
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT)
  const navigation = getNavigation(t)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => setSidebarShow(visible)}
      overlaid={isMobile}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/" className="d-flex align-items-center gap-2">
          <Logo size={36} className="sidebar-brand-full" />
          <LogoMini size={32} className="sidebar-brand-narrow" />
          <span className="sidebar-brand-full fs-5 fw-semibold">
            {t('brand')}
          </span>
        </CSidebarBrand>
      </CSidebarHeader>
      <AppSidebarNav items={navigation} />
      <CSidebarToggler
        className="d-none d-lg-flex"
        onClick={() => setUnfoldable(!unfoldable)}
      />
    </CSidebar>
  )
}

export default AppSidebar
