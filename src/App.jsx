import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { CSpinner } from '@coreui/react'

// i18n
import './i18n'

// Layout
import DefaultLayout from './components/layout/DefaultLayout'

// Auth views (eager loading)
import Login from './views/auth/Login'
import Register from './views/auth/Register'

// Public views (lazy loading)
const SharedNote = lazy(() => import('./views/notes/SharedNote'))

// Context
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// Loading component
const Loading = () => (
  <div className="d-flex justify-content-center align-items-center min-vh-100">
    <CSpinner color="primary" />
  </div>
)

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/shared/:shareToken" element={<SharedNote />} />

            {/* Protected routes */}
            <Route path="/*" element={<DefaultLayout />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
