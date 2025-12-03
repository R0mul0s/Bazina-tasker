import { useLocation } from 'react-router-dom'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'
import routes from '../../routes'

const AppBreadcrumb = () => {
  const location = useLocation()

  const getRouteName = (pathname, routes) => {
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
    return currentRoute?.name
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    const pathParts = location.split('/').filter((part) => part)

    pathParts.reduce((prev, curr, index) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, routes)

      if (routeName) {
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
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
      <CBreadcrumbItem href="/">Domů</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => (
        <CBreadcrumbItem
          {...(breadcrumb.active
            ? { active: true }
            : { href: breadcrumb.pathname })}
          key={index}
        >
          {breadcrumb.name}
        </CBreadcrumbItem>
      ))}
    </CBreadcrumb>
  )
}

export default AppBreadcrumb
