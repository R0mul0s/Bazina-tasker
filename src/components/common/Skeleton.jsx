import { CPlaceholder, CCard, CCardBody, CCardHeader, CRow, CCol } from '@coreui/react'

// Skeleton pro statistickou kartu
export const StatCardSkeleton = () => (
  <CCard className="mb-4">
    <CCardBody className="d-flex align-items-center">
      <CPlaceholder
        component="div"
        className="rounded bg-secondary bg-opacity-25 me-3"
        style={{ width: '48px', height: '48px' }}
      />
      <div className="flex-grow-1">
        <CPlaceholder xs={4} size="sm" className="mb-2" />
        <CPlaceholder xs={3} size="lg" />
      </div>
    </CCardBody>
  </CCard>
)

// Skeleton pro seznam položek
export const ListItemSkeleton = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="d-flex justify-content-between align-items-center py-3 border-bottom">
        <div className="flex-grow-1">
          <CPlaceholder xs={6} className="mb-2" />
          <CPlaceholder xs={4} size="sm" />
        </div>
        <CPlaceholder xs={2} size="sm" style={{ width: '60px' }} />
      </div>
    ))}
  </>
)

// Skeleton pro kartu se seznamem
export const ListCardSkeleton = ({ title, count = 5 }) => (
  <CCard className="mb-4">
    <CCardHeader>
      <CPlaceholder xs={4} />
    </CCardHeader>
    <CCardBody>
      <ListItemSkeleton count={count} />
    </CCardBody>
  </CCard>
)

// Skeleton pro dashboard
export const DashboardSkeleton = () => (
  <>
    <CPlaceholder xs={4} size="lg" className="mb-4" />
    <CRow>
      <CCol sm={6} xl={3}>
        <StatCardSkeleton />
      </CCol>
      <CCol sm={6} xl={3}>
        <StatCardSkeleton />
      </CCol>
      <CCol sm={6} xl={3}>
        <StatCardSkeleton />
      </CCol>
      <CCol sm={6} xl={3}>
        <StatCardSkeleton />
      </CCol>
    </CRow>
    <CRow>
      <CCol lg={6}>
        <ListCardSkeleton count={5} />
      </CCol>
      <CCol lg={6}>
        <ListCardSkeleton count={5} />
      </CCol>
    </CRow>
  </>
)

// Skeleton pro tabulku zákazníků/poznámek
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <CCard className="mb-4">
    <CCardHeader>
      <CPlaceholder xs={3} />
    </CCardHeader>
    <CCardBody>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <CPlaceholder xs={8} size="sm" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: cols }).map((_, colIdx) => (
                  <td key={colIdx}>
                    <CPlaceholder xs={colIdx === 0 ? 10 : 6} size="sm" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CCardBody>
  </CCard>
)

// Skeleton pro detail poznámky
export const NoteDetailSkeleton = () => (
  <CRow>
    <CCol lg={8}>
      <CCard className="mb-4">
        <CCardHeader>
          <CPlaceholder xs={6} size="lg" />
        </CCardHeader>
        <CCardBody>
          <CPlaceholder xs={12} className="mb-2" />
          <CPlaceholder xs={10} className="mb-2" />
          <CPlaceholder xs={8} className="mb-2" />
          <CPlaceholder xs={11} className="mb-2" />
          <CPlaceholder xs={7} />
        </CCardBody>
      </CCard>
    </CCol>
    <CCol lg={4}>
      <CCard className="mb-4">
        <CCardHeader>
          <CPlaceholder xs={5} />
        </CCardHeader>
        <CCardBody>
          <CPlaceholder xs={8} className="mb-3" />
          <CPlaceholder xs={6} className="mb-3" />
          <CPlaceholder xs={10} className="mb-3" />
          <CPlaceholder xs={7} />
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
)

// Skeleton pro detail zákazníka
export const CustomerDetailSkeleton = () => (
  <CRow>
    <CCol lg={4}>
      <CCard className="mb-4">
        <CCardHeader>
          <CPlaceholder xs={5} />
        </CCardHeader>
        <CCardBody>
          <CPlaceholder xs={8} className="mb-3" />
          <CPlaceholder xs={10} className="mb-3" />
          <CPlaceholder xs={6} className="mb-3" />
          <CPlaceholder xs={12} />
        </CCardBody>
      </CCard>
    </CCol>
    <CCol lg={8}>
      <ListCardSkeleton count={3} />
    </CCol>
  </CRow>
)

// Skeleton pro graf
export const ChartSkeleton = ({ height = 300 }) => (
  <CCard className="mb-4">
    <CCardHeader>
      <CPlaceholder xs={4} />
    </CCardHeader>
    <CCardBody>
      <div
        className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded"
        style={{ height: `${height}px` }}
      >
        <CPlaceholder xs={2} animation="wave" />
      </div>
    </CCardBody>
  </CCard>
)

export default {
  StatCardSkeleton,
  ListItemSkeleton,
  ListCardSkeleton,
  DashboardSkeleton,
  TableSkeleton,
  NoteDetailSkeleton,
  CustomerDetailSkeleton,
  ChartSkeleton,
}
