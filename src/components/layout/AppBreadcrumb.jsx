import { useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'
import routes from '../../routes'

const AppBreadcrumb = () => {
  const { t } = useTranslation('navigation')
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const fromKanban = searchParams.get('from') === 'kanban'

  const getRouteNameKey = (pathname, routes) => {
    const currentRoute = routes.find((route) => {
      // Přesná shoda
      if (route.path === pathname) return true
      // Dynamické parametry (např. /customers/:id)
      const routeParts = route.path.split('/')
      const pathParts = pathname.split('/')
      if (routeParts.length !== pathParts.length) return false
      return routeParts.every((part, i) => {
        if (part.startsWith(':')) return true
        return part === pathParts[i]
      })
    })
    return currentRoute?.nameKey
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    const pathParts = location.split('/').filter((part) => part)

    pathParts.reduce((prev, curr, index) => {
      const currentPathname = `${prev}/${curr}`
      const nameKey = getRouteNameKey(currentPathname, routes)

      if (nameKey) {
        breadcrumbs.push({
          pathname: currentPathname,
          nameKey: nameKey,
          active: index === pathParts.length - 1,
        })
      }

      return currentPathname
    }, '')

    return breadcrumbs
  }

  // Zjistíme, zda jsme na detailu poznámky z kanbanu
  const isNoteDetailFromKanban = fromKanban && location.pathname.match(/^\/notes\/[^/]+$/)

  let breadcrumbs = getBreadcrumbs(location.pathname)

  // Pokud jsme přišli z kanbanu, nahradíme "Poznámky" za "Kanban"
  if (isNoteDetailFromKanban && breadcrumbs.length > 0) {
    breadcrumbs = breadcrumbs.map((crumb, index) => {
      // Nahradit první položku (poznámky) za kanban
      if (crumb.pathname === '/notes') {
        return {
          pathname: '/kanban',
          nameKey: 'routes.kanban',
          active: false,
        }
      }
      return crumb
    })
  }

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem href="/">{t('routes.home')}</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => (
        <CBreadcrumbItem
          {...(breadcrumb.active
            ? { active: true }
            : { href: breadcrumb.pathname })}
          key={index}
        >
          {t(breadcrumb.nameKey)}
        </CBreadcrumbItem>
      ))}
    </CBreadcrumb>
  )
}

export default AppBreadcrumb
