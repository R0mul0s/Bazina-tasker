import { useState, useEffect } from 'react'
import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CSidebarToggler,
  CSidebarHeader,
} from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'

import navigation from '../../_nav'

// Breakpoint pro mobile (lg = 992px)
const MOBILE_BREAKPOINT = 992

const AppSidebar = ({ sidebarShow, setSidebarShow, unfoldable, setUnfoldable }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT)

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
        <CSidebarBrand to="/" className="d-flex align-items-center">
          <span className="sidebar-brand-full fs-5 fw-semibold">
            Bazina Tasker
          </span>
          <span className="sidebar-brand-narrow fs-5 fw-semibold">BT</span>
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
