import { useState, useMemo, useCallback } from 'react'
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CPagination,
  CPaginationItem,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter, cilArrowTop, cilArrowBottom, cilSwapVertical } from '@coreui/icons'

/**
 * SmartTable - CoreUI style tabulka s filtrováním, řazením a stránkováním
 *
 * @param {Array} items - data pro tabulku
 * @param {Array} columns - definice sloupců [{key, label, filter, sorter, _style, _props}]
 * @param {boolean} columnFilter - povolit filtry ve sloupcích
 * @param {boolean} tableFilter - povolit globální filtr
 * @param {boolean} sorter - povolit řazení
 * @param {boolean} pagination - povolit stránkování
 * @param {number} itemsPerPage - počet položek na stránku
 * @param {Array} itemsPerPageOptions - možnosti pro počet položek
 * @param {boolean} selectable - povolit výběr řádků
 * @param {Set} selected - vybrané položky (ids)
 * @param {Function} onSelectedChange - callback při změně výběru
 * @param {Function} onRowClick - callback při kliknutí na řádek
 * @param {Function} scopedSlots - custom renderování buněk
 * @param {string} tableFilterLabel - label pro globální filtr
 * @param {string} tableFilterPlaceholder - placeholder pro globální filtr
 * @param {string} noItemsLabel - text když nejsou data
 */
const SmartTable = ({
  items = [],
  columns = [],
  columnFilter = false,
  tableFilter = false,
  sorter = true,
  pagination = true,
  itemsPerPage = 10,
  itemsPerPageOptions = [5, 10, 20, 50],
  selectable = false,
  selected = new Set(),
  onSelectedChange,
  onRowClick,
  scopedSlots = {},
  tableFilterLabel = 'Filter:',
  tableFilterPlaceholder = 'type string...',
  noItemsLabel = 'Žádné položky',
  itemsPerPageLabel = 'Items per page:',
  defaultSort = null, // { key: 'created_at', direction: 'desc' }
}) => {
  // State
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState({})
  const [sortConfig, setSortConfig] = useState(defaultSort || { key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(itemsPerPage)

  // Filtrování dat
  const filteredItems = useMemo(() => {
    let result = [...items]

    // Globální filtr
    if (globalFilter.trim()) {
      const query = globalFilter.toLowerCase()
      result = result.filter((item) =>
        columns.some((col) => {
          if (col.filter === false) return false
          const value = item[col.key]
          if (value == null) return false
          return String(value).toLowerCase().includes(query)
        })
      )
    }

    // Sloupcové filtry
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue.trim()) {
        const query = filterValue.toLowerCase()
        result = result.filter((item) => {
          const value = item[key]
          if (value == null) return false
          return String(value).toLowerCase().includes(query)
        })
      }
    })

    return result
  }, [items, globalFilter, columnFilters, columns])

  // Řazení dat
  const sortedItems = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredItems

    return [...filteredItems].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal, 'cs')
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime()
      } else {
        comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredItems, sortConfig])

  // Stránkování
  const paginatedItems = useMemo(() => {
    if (!pagination) return sortedItems
    const start = (currentPage - 1) * perPage
    return sortedItems.slice(start, start + perPage)
  }, [sortedItems, currentPage, perPage, pagination])

  const totalPages = Math.ceil(sortedItems.length / perPage)

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return { key: null, direction: null }
    })
  }, [])

  const handleColumnFilter = useCallback((key, value) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  const handleGlobalFilter = useCallback((value) => {
    setGlobalFilter(value)
    setCurrentPage(1)
  }, [])

  const handlePerPageChange = useCallback((value) => {
    setPerPage(Number(value))
    setCurrentPage(1)
  }, [])

  // Selection helpers
  const isAllSelected = paginatedItems.length > 0 && paginatedItems.every((item) => selected.has(item.id))
  const isSomeSelected = paginatedItems.some((item) => selected.has(item.id))

  const toggleSelectAll = () => {
    if (!onSelectedChange) return
    if (isAllSelected) {
      // Odznačit vše na aktuální stránce
      const newSelected = new Set(selected)
      paginatedItems.forEach((item) => newSelected.delete(item.id))
      onSelectedChange(newSelected)
    } else {
      // Vybrat vše na aktuální stránce
      const newSelected = new Set(selected)
      paginatedItems.forEach((item) => newSelected.add(item.id))
      onSelectedChange(newSelected)
    }
  }

  const toggleSelect = (id) => {
    if (!onSelectedChange) return
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    onSelectedChange(newSelected)
  }

  // Render sort icon
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <CIcon icon={cilSwapVertical} className="ms-1 text-secondary" size="sm" />
    }
    return sortConfig.direction === 'asc' ? (
      <CIcon icon={cilArrowTop} className="ms-1" size="sm" />
    ) : (
      <CIcon icon={cilArrowBottom} className="ms-1" size="sm" />
    )
  }

  // Render pagination
  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null

    const pages = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
        <CPagination size="sm" className="mb-0">
          <CPaginationItem
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            «
          </CPaginationItem>
          <CPaginationItem
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </CPaginationItem>
          {pages.map((page) => (
            <CPaginationItem
              key={page}
              active={page === currentPage}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </CPaginationItem>
          ))}
          <CPaginationItem
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </CPaginationItem>
          <CPaginationItem
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            »
          </CPaginationItem>
        </CPagination>

        <div className="d-flex align-items-center gap-2">
          <span className="text-secondary small">{itemsPerPageLabel}</span>
          <CFormSelect
            size="sm"
            style={{ width: 'auto' }}
            value={perPage}
            onChange={(e) => handlePerPageChange(e.target.value)}
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </CFormSelect>
        </div>
      </div>
    )
  }

  return (
    <div className="smart-table">
      {/* Globální filtr */}
      {tableFilter && (
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="text-secondary">{tableFilterLabel}</span>
          <CInputGroup style={{ maxWidth: '300px' }}>
            <CFormInput
              placeholder={tableFilterPlaceholder}
              value={globalFilter}
              onChange={(e) => handleGlobalFilter(e.target.value)}
            />
            <CInputGroupText>
              <CIcon icon={cilFilter} />
            </CInputGroupText>
          </CInputGroup>
        </div>
      )}

      {/* Tabulka */}
      <CTable hover responsive className="smart-table__table">
        <CTableHead>
          {/* Hlavička s názvy sloupců */}
          <CTableRow>
            {selectable && (
              <CTableHeaderCell style={{ width: '40px' }}>
                <CFormCheck
                  checked={isAllSelected}
                  indeterminate={isSomeSelected && !isAllSelected}
                  onChange={toggleSelectAll}
                />
              </CTableHeaderCell>
            )}
            {columns.map((col) => (
              <CTableHeaderCell
                key={col.key}
                style={col._style}
                {...col._props}
                className={`${sorter && col.sorter !== false ? 'cursor-pointer user-select-none' : ''}`}
                onClick={() => sorter && col.sorter !== false && handleSort(col.key)}
              >
                <div className="d-flex align-items-center">
                  {col.label}
                  {sorter && col.sorter !== false && renderSortIcon(col.key)}
                </div>
              </CTableHeaderCell>
            ))}
          </CTableRow>

          {/* Řádek s filtry */}
          {columnFilter && (
            <CTableRow className="smart-table__filters">
              {selectable && <CTableHeaderCell />}
              {columns.map((col) => (
                <CTableHeaderCell key={`filter-${col.key}`} className="p-2">
                  {col.filter !== false && (
                    <CFormInput
                      size="sm"
                      placeholder=""
                      value={columnFilters[col.key] || ''}
                      onChange={(e) => handleColumnFilter(col.key, e.target.value)}
                    />
                  )}
                </CTableHeaderCell>
              ))}
            </CTableRow>
          )}
        </CTableHead>

        <CTableBody>
          {paginatedItems.length === 0 ? (
            <CTableRow>
              <CTableDataCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="text-center text-secondary py-4"
              >
                {noItemsLabel}
              </CTableDataCell>
            </CTableRow>
          ) : (
            paginatedItems.map((item, index) => (
              <CTableRow
                key={item.id || index}
                className={`${onRowClick ? 'cursor-pointer' : ''} ${selected.has(item.id) ? 'table-active' : ''}`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {selectable && (
                  <CTableDataCell onClick={(e) => e.stopPropagation()}>
                    <CFormCheck
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </CTableDataCell>
                )}
                {columns.map((col) => (
                  <CTableDataCell key={col.key} style={col._style}>
                    {scopedSlots[col.key]
                      ? scopedSlots[col.key](item)
                      : item[col.key] ?? '-'}
                  </CTableDataCell>
                ))}
              </CTableRow>
            ))
          )}
        </CTableBody>

        {/* Footer s názvy sloupců (volitelně) */}
        {pagination && sortedItems.length > perPage && (
          <tfoot>
            <CTableRow>
              {selectable && <CTableHeaderCell />}
              {columns.map((col) => (
                <CTableHeaderCell key={`footer-${col.key}`} style={col._style}>
                  {col.label}
                </CTableHeaderCell>
              ))}
            </CTableRow>
          </tfoot>
        )}
      </CTable>

      {/* Stránkování */}
      {renderPagination()}
    </div>
  )
}

export default SmartTable
