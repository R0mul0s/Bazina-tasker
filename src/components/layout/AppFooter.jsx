import { CFooter } from '@coreui/react'

const AppFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1">Bazina Tasker &copy; {currentYear}</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Created by</span>
        <a
          href="https://rhsoft.cz"
          target="_blank"
          rel="noopener noreferrer"
        >
          RHsoft.cz
        </a>
      </div>
    </CFooter>
  )
}

export default AppFooter
