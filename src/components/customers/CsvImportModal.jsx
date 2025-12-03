import { useState, useRef } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CAlert,
  CSpinner,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CProgress,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilFile, cilCheckCircle, cilXCircle } from '@coreui/icons'

// Parsování CSV
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) {
    return { headers: [], rows: [], error: 'CSV musí obsahovat hlavičku a alespoň jeden řádek dat.' }
  }

  // Parsování s podporou quoted values
  const parseLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map((line) => parseLine(line))

  return { headers, rows, error: null }
}

// Mapování sloupců CSV na databázové sloupce
const COLUMN_MAPPING = {
  // Variace pro "name"
  name: 'name',
  jmeno: 'name',
  jméno: 'name',
  nazev: 'name',
  název: 'name',
  zakaznik: 'name',
  zákazník: 'name',
  customer: 'name',
  'customer name': 'name',

  // Variace pro "company"
  company: 'company',
  firma: 'company',
  spolecnost: 'company',
  společnost: 'company',
  organization: 'company',
  organizace: 'company',

  // Variace pro "email"
  email: 'email',
  mail: 'email',
  'e-mail': 'email',

  // Variace pro "phone"
  phone: 'phone',
  telefon: 'phone',
  tel: 'phone',
  mobil: 'phone',
  mobile: 'phone',

  // Variace pro "address"
  address: 'address',
  adresa: 'address',

  // Variace pro "notes"
  notes: 'notes',
  poznamky: 'notes',
  poznámky: 'notes',
  note: 'notes',
  poznamka: 'notes',
  poznámka: 'notes',
}

const normalizeHeader = (header) => {
  const normalized = header.toLowerCase().trim()
  return COLUMN_MAPPING[normalized] || null
}

const CsvImportModal = ({ visible, onClose, onImport }) => {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [columnMap, setColumnMap] = useState({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onerror = () => {
      setError('Chyba při čtení souboru')
    }
    reader.onload = (event) => {
      const text = event.target.result
      const { headers, rows, error: parseError } = parseCSV(text)

      if (parseError) {
        setError(parseError)
        setParsedData(null)
        return
      }

      // Auto-mapování sloupců
      const autoMap = {}
      headers.forEach((header, index) => {
        const mapped = normalizeHeader(header)
        if (mapped) {
          autoMap[index] = mapped
        }
      })

      setColumnMap(autoMap)
      setParsedData({ headers, rows })
    }
    reader.readAsText(selectedFile, 'UTF-8')
  }

  const handleImport = async () => {
    if (!parsedData) return

    // Zkontrolovat, že máme alespoň name
    const hasName = Object.values(columnMap).includes('name')

    if (!hasName) {
      setError('Je nutné namapovat alespoň sloupec "Jméno".')
      return
    }

    setImporting(true)
    setError(null)

    // Připravit data
    const customersData = parsedData.rows
      .map((row) => {
        const customer = {}
        Object.entries(columnMap).forEach(([csvIndex, dbField]) => {
          if (dbField) {
            const value = row[parseInt(csvIndex)]
            if (value) {
              customer[dbField] = value
            }
          }
        })
        return customer
      })
      .filter((c) => c.name) // Filtrovat pouze záznamy s jménem

    if (customersData.length === 0) {
      setError('Žádné platné záznamy k importu.')
      setImporting(false)
      return
    }

    const importResult = await onImport(customersData)
    setImporting(false)
    setResult(importResult)
  }

  const handleClose = () => {
    setFile(null)
    setParsedData(null)
    setColumnMap({})
    setResult(null)
    setError(null)
    onClose()
  }

  const dbFields = [
    { key: 'name', label: 'Jméno *' },
    { key: 'company', label: 'Firma' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefon' },
    { key: 'address', label: 'Adresa' },
    { key: 'notes', label: 'Poznámky' },
  ]

  return (
    <CModal visible={visible} onClose={handleClose} size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>Import zákazníků z CSV</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {/* Výsledek importu */}
        {result && (
          <CAlert color={result.error ? 'warning' : 'success'} className="mb-3">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={result.imported > 0 ? cilCheckCircle : cilXCircle} size="lg" />
              <div>
                <strong>Import dokončen</strong>
                <div>
                  Importováno: {result.imported} zákazníků
                  {result.failed > 0 && <span className="text-danger"> | Selhalo: {result.failed}</span>}
                </div>
              </div>
            </div>
          </CAlert>
        )}

        {/* Error */}
        {error && (
          <CAlert color="danger" className="mb-3">
            {error}
          </CAlert>
        )}

        {/* File upload */}
        {!parsedData && !result && (
          <div
            className="border border-dashed rounded p-5 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            style={{ borderStyle: 'dashed' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="d-none"
            />
            <CIcon icon={cilCloudUpload} size="3xl" className="text-secondary mb-3" />
            <div className="mb-2">
              <strong>Klikněte pro výběr CSV souboru</strong>
            </div>
            <small className="text-secondary">
              Podporované sloupce: Jméno, Firma, Email, Telefon, Adresa, Poznámky
            </small>
          </div>
        )}

        {/* File info */}
        {file && !result && (
          <div className="d-flex align-items-center gap-2 mb-3 p-2 bg-light rounded">
            <CIcon icon={cilFile} />
            <span>{file.name}</span>
            <small className="text-secondary">({parsedData?.rows.length || 0} záznamů)</small>
          </div>
        )}

        {/* Column mapping */}
        {parsedData && !result && (
          <>
            <h6 className="mb-3">Mapování sloupců</h6>
            <CTable small bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Sloupec v CSV</CTableHeaderCell>
                  <CTableHeaderCell>Cílové pole</CTableHeaderCell>
                  <CTableHeaderCell>Ukázka dat</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {parsedData.headers.map((header, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{header}</CTableDataCell>
                    <CTableDataCell>
                      <select
                        className="form-select form-select-sm"
                        value={columnMap[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          setColumnMap((prev) => {
                            const newMap = { ...prev }
                            if (value) {
                              newMap[index] = value
                            } else {
                              delete newMap[index]
                            }
                            return newMap
                          })
                        }}
                      >
                        <option value="">-- Přeskočit --</option>
                        {dbFields.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </CTableDataCell>
                    <CTableDataCell className="text-secondary small">
                      {parsedData.rows[0]?.[index] || '-'}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            {/* Preview */}
            <h6 className="mb-2 mt-4">Náhled dat (prvních 5 záznamů)</h6>
            <CTable small bordered responsive>
              <CTableHead>
                <CTableRow>
                  {dbFields
                    .filter((f) => Object.values(columnMap).includes(f.key))
                    .map((f) => (
                      <CTableHeaderCell key={f.key}>{f.label}</CTableHeaderCell>
                    ))}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {parsedData.rows.slice(0, 5).map((row, rowIndex) => (
                  <CTableRow key={rowIndex}>
                    {dbFields
                      .filter((f) => Object.values(columnMap).includes(f.key))
                      .map((f) => {
                        const csvIndex = Object.entries(columnMap).find(
                          ([, v]) => v === f.key
                        )?.[0]
                        return (
                          <CTableDataCell key={f.key}>
                            {csvIndex !== undefined ? row[parseInt(csvIndex)] || '-' : '-'}
                          </CTableDataCell>
                        )
                      })}
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </>
        )}

        {/* Importing progress */}
        {importing && (
          <div className="text-center py-4">
            <CSpinner className="mb-3" />
            <div>Importuji zákazníky...</div>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClose}>
          {result ? 'Zavřít' : 'Zrušit'}
        </CButton>
        {parsedData && !result && (
          <CButton color="primary" onClick={handleImport} disabled={importing}>
            {importing ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Importuji...
              </>
            ) : (
              <>
                <CIcon icon={cilCloudUpload} className="me-2" />
                Importovat {parsedData.rows.length} záznamů
              </>
            )}
          </CButton>
        )}
      </CModalFooter>
    </CModal>
  )
}

export default CsvImportModal
