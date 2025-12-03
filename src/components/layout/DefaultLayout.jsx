import { useState, useEffect, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'

import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'
import AppFooter from './AppFooter'
import AppBreadcrumb from './AppBreadcrumb'
import { useAuth } from '../../context/AuthContext'

import routes from '../../routes'

// Breakpoint pro mobile (lg = 992px)
const MOBILE_BREAKPOINT = 992

const DefaultLayout = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Detekce mobile při inicializaci
  const isMobile = () => window.innerWidth < MOBILE_BREAKPOINT

  const [sidebarShow, setSidebarShow] = useState(() => !isMobile())
  const [unfoldable, setUnfoldable] = useState(false)

  // Zavřít sidebar při změně routy na mobile
  useEffect(() => {
    if (isMobile()) {
      setSidebarShow(false)
    }
  }, [location.pathname])

  // Reagovat na změnu velikosti okna
  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) {
        setSidebarShow(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Loading stav při kontrole autentizace
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <CSpinner color="primary" />
      </div>
    )
  }

  // Redirect na login pokud není přihlášen
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Sestavení tříd pro wrapper podle stavu sidebaru
  const getWrapperClasses = () => {
    const classes = ['wrapper', 'd-flex', 'flex-column', 'min-vh-100']
    if (sidebarShow && !isMobile()) {
      classes.push(unfoldable ? 'sidebar-narrow-show' : 'sidebar-show')
    }
    return classes.join(' ')
  }

  return (
    <div className="app-wrapper">
      <AppSidebar
        sidebarShow={sidebarShow}
        setSidebarShow={setSidebarShow}
        unfoldable={unfoldable}
        setUnfoldable={setUnfoldable}
      />
      <div className={getWrapperClasses()}>
        <AppHeader sidebarShow={sidebarShow} setSidebarShow={setSidebarShow} />
        <div className="body flex-grow-1">
          <CContainer lg className="px-4">
            <AppBreadcrumb />
            <Suspense
              fallback={
                <div className="d-flex justify-content-center py-5">
                  <CSpinner color="primary" />
                </div>
              }
            >
              <Routes>
                {routes.map((route, idx) => {
                  return (
                    route.element && (
                      <Route
                        key={idx}
                        path={route.path}
                        exact={route.exact}
                        name={route.name}
                        element={<route.element />}
                      />
                    )
                  )
                })}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </CContainer>
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
