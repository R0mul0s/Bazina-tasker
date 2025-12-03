import { NavLink } from 'react-router-dom'
import { CBadge, CSidebarNav } from '@coreui/react'

export const AppSidebarNav = ({ items }) => {
  const navLink = (name, icon, badge, indent = false) => {
    return (
      <>
        {icon}
        {name}
        {badge && (
          <CBadge color={badge.color} className="ms-auto">
            {badge.text}
          </CBadge>
        )}
      </>
    )
  }

  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, ...rest } = item
    const Component = component
    return (
      <Component as="div" key={index}>
        {rest.to ? (
          <NavLink
            {...rest}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            {navLink(name, icon, badge, indent)}
          </NavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    )
  }

  const navGroup = (item, index) => {
    const { component, name, icon, items, ...rest } = item
    const Component = component
    return (
      <Component
        compact
        idx={String(index)}
        key={index}
        toggler={navLink(name, icon)}
        visible={false}
        {...rest}
      >
        {items?.map((subItem, subIndex) =>
          subItem.items ? navGroup(subItem, subIndex) : navItem(subItem, subIndex, true)
        )}
      </Component>
    )
  }

  return (
    <CSidebarNav as="nav">
      {items &&
        items.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index)
        )}
    </CSidebarNav>
  )
}
