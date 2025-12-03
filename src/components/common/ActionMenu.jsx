import { useState } from 'react'
import {
  CButton,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilOptions } from '@coreui/icons'

/**
 * ActionMenu - Responzivní menu akcí
 *
 * Na desktopu zobrazuje tlačítka vedle sebe
 * Na mobilu zobrazuje dropdown menu
 *
 * @param {Array} actions - Pole akcí [{icon, label, onClick, color, variant, disabled, loading, danger, dividerAfter}]
 * @param {string} size - Velikost tlačítek ('sm' | 'md')
 * @param {string} breakpoint - Breakpoint pro přepnutí na dropdown ('sm' | 'md' | 'lg' | 'xl')
 * @param {boolean} iconsOnly - Na desktopu zobrazit pouze ikony (bez textu)
 * @param {string} dropdownPlacement - Umístění dropdown menu
 */
const ActionMenu = ({
  actions = [],
  size = 'sm',
  breakpoint = 'md',
  iconsOnly = false,
  dropdownPlacement = 'bottom-end',
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false)

  if (actions.length === 0) return null

  // Filtrovat viditelné akce
  const visibleActions = actions.filter(action => action.visible !== false)

  if (visibleActions.length === 0) return null

  // Desktop verze - tlačítka vedle sebe
  const desktopButtons = (
    <div className={`d-none d-${breakpoint}-flex gap-2`}>
      {visibleActions.map((action, index) => (
        <CButton
          key={index}
          color={action.danger ? 'danger' : (action.color || 'light')}
          variant={action.variant || (action.danger ? 'outline' : undefined)}
          size={size}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          title={action.label}
          className={action.className}
        >
          {action.loading ? (
            <CSpinner size="sm" className={!iconsOnly && action.label ? 'me-2' : ''} />
          ) : action.icon ? (
            <CIcon icon={action.icon} className={!iconsOnly && action.label ? 'me-2' : ''} />
          ) : null}
          {!iconsOnly && action.label}
        </CButton>
      ))}
    </div>
  )

  // Mobile verze - dropdown menu
  const mobileDropdown = (
    <div className={`d-${breakpoint}-none`}>
      <CDropdown
        variant="btn-group"
        placement={dropdownPlacement}
        visible={dropdownVisible}
        onVisibleChange={setDropdownVisible}
      >
        <CDropdownToggle color="light" size={size}>
          <CIcon icon={cilOptions} />
        </CDropdownToggle>
        <CDropdownMenu>
          {visibleActions.map((action, index) => (
            <div key={index}>
              <CDropdownItem
                className={`cursor-pointer ${action.danger ? 'text-danger' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setDropdownVisible(false)
                  action.onClick?.(e)
                }}
                disabled={action.disabled || action.loading}
              >
                {action.loading ? (
                  <CSpinner size="sm" className="me-2" />
                ) : action.icon ? (
                  <CIcon icon={action.icon} className="me-2" />
                ) : null}
                {action.label}
              </CDropdownItem>
              {action.dividerAfter && <CDropdownDivider />}
            </div>
          ))}
        </CDropdownMenu>
      </CDropdown>
    </div>
  )

  return (
    <>
      {desktopButtons}
      {mobileDropdown}
    </>
  )
}

export default ActionMenu
