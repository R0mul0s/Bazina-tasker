import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'
import routes from '../../routes'

const AppBreadcrumb = () => {
  const { t } = useTranslation('navigation')
  const location = useLocation()

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

  const breadcrumbs = getBreadcrumbs(location.pathname)

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
