import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownHeader,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilUser, cilNotes, cilTags, cilX } from '@coreui/icons'
import { useGlobalSearch } from '../../hooks/useGlobalSearch'

const GlobalSearch = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { loading, results, search, clearResults, hasResults } = useGlobalSearch()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        search(query)
        setIsOpen(true)
      }, 300)
    } else {
      clearResults()
      setIsOpen(false)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, search, clearResults])

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (type, item) => {
    setQuery('')
    setIsOpen(false)
    clearResults()

    switch (type) {
      case 'customer':
        navigate(`/customers/${item.id}`)
        break
      case 'note':
        navigate(`/notes/${item.id}`)
        break
      case 'tag':
        navigate(`/tags?highlight=${item.id}`)
        break
      default:
        break
    }
  }

  const handleClear = () => {
    setQuery('')
    clearResults()
    setIsOpen(false)
  }

  // Strip HTML tags from content for preview
  const stripHtml = (html) => {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').substring(0, 60) + '...'
  }

  return (
    <div ref={containerRef} className="global-search position-relative">
      <CInputGroup className="global-search__input">
        <CInputGroupText className="bg-transparent border-end-0">
          {loading ? (
            <CSpinner size="sm" color="secondary" />
          ) : (
            <CIcon icon={cilSearch} className="text-secondary" />
          )}
        </CInputGroupText>
        <CFormInput
          ref={inputRef}
          type="text"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hasResults && setIsOpen(true)}
          className="border-start-0"
        />
        {query && (
          <CInputGroupText
            className="bg-transparent border-start-0 cursor-pointer"
            onClick={handleClear}
          >
            <CIcon icon={cilX} className="text-secondary" />
          </CInputGroupText>
        )}
      </CInputGroup>

      {isOpen && (hasResults || loading) && (
        <div className="global-search__results">
          {loading && !hasResults && (
            <div className="text-center py-3">
              <CSpinner size="sm" color="primary" />
              <span className="ms-2">{t('search.searching')}</span>
            </div>
          )}

          {/* Zákazníci */}
          {results.customers.length > 0 && (
            <>
              <div className="global-search__header">
                <CIcon icon={cilUser} className="me-2" />
                {t('search.customers')}
              </div>
              {results.customers.map((customer) => (
                <div
                  key={customer.id}
                  className="global-search__item"
                  onClick={() => handleSelect('customer', customer)}
                >
                  <div className="global-search__item-title">{customer.name}</div>
                  <div className="global-search__item-subtitle">
                    {customer.company && `${customer.company} • `}
                    {customer.email}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Poznámky */}
          {results.notes.length > 0 && (
            <>
              <div className="global-search__header">
                <CIcon icon={cilNotes} className="me-2" />
                {t('search.notes')}
              </div>
              {results.notes.map((note) => (
                <div
                  key={note.id}
                  className="global-search__item"
                  onClick={() => handleSelect('note', note)}
                >
                  <div className="global-search__item-title">{note.title}</div>
                  <div className="global-search__item-subtitle">
                    {note.customer?.name && `${note.customer.name} • `}
                    {stripHtml(note.content)}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Tagy */}
          {results.tags.length > 0 && (
            <>
              <div className="global-search__header">
                <CIcon icon={cilTags} className="me-2" />
                {t('search.tags')}
              </div>
              {results.tags.map((tag) => (
                <div
                  key={tag.id}
                  className="global-search__item"
                  onClick={() => handleSelect('tag', tag)}
                >
                  <span className={`tag-badge tag-badge--${tag.color} me-2`}>
                    {tag.name}
                  </span>
                </div>
              ))}
            </>
          )}

          {!loading && !hasResults && query.length >= 2 && (
            <div className="text-center text-secondary py-3">
              {t('search.noResults', { query })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
