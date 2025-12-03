import { useTranslation } from 'react-i18next'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react'
import { useTheme } from '../../context/ThemeContext'

// Registrace Chart.js komponent
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Barvy pro grafy
const chartColors = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
}

// Graf: Poznámky za týden
export const NotesPerWeekChart = ({ data }) => {
  const { t } = useTranslation('dashboard')
  const { isDark } = useTheme()

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: t('charts.notes'),
        data: data.map((d) => d.count),
        borderColor: chartColors.primary,
        backgroundColor: `${chartColors.primary}20`,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        },
      },
    },
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>{t('charts.notesPerWeek')}</strong>
        <small className="text-secondary ms-2">{t('charts.notesPerWeekSubtitle')}</small>
      </CCardHeader>
      <CCardBody>
        <div style={{ height: '250px' }}>
          <Line data={chartData} options={options} />
        </div>
      </CCardBody>
    </CCard>
  )
}

// Graf: Čas strávený s zákazníky
export const TimePerCustomerChart = ({ data }) => {
  const { t } = useTranslation('dashboard')
  const { isDark } = useTheme()

  if (data.length === 0) {
    return (
      <CCard className="mb-4">
        <CCardHeader>
          <strong>{t('charts.timePerCustomer')}</strong>
        </CCardHeader>
        <CCardBody className="text-center text-secondary py-4">
          {t('charts.noTimeRecords')}
        </CCardBody>
      </CCard>
    )
  }

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: t('charts.hours'),
        data: data.map((d) => d.hours),
        backgroundColor: [
          chartColors.primary,
          chartColors.success,
          chartColors.warning,
          chartColors.info,
          chartColors.purple,
        ],
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        },
      },
      y: {
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>{t('charts.timePerCustomer')}</strong>
        <small className="text-secondary ms-2">{t('charts.timePerCustomerSubtitle')}</small>
      </CCardHeader>
      <CCardBody>
        <div style={{ height: '250px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CCardBody>
    </CCard>
  )
}

// Graf: Poznámky podle typu
export const NotesByTypeChart = ({ data }) => {
  const { t } = useTranslation('dashboard')
  const { isDark } = useTheme()

  if (data.length === 0) {
    return (
      <CCard className="mb-4">
        <CCardHeader>
          <strong>{t('charts.notesByType')}</strong>
        </CCardHeader>
        <CCardBody className="text-center text-secondary py-4">
          {t('charts.noNotes')}
        </CCardBody>
      </CCard>
    )
  }

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: [
          chartColors.primary,
          chartColors.success,
          chartColors.warning,
          chartColors.info,
        ],
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#9ca3af' : '#6b7280',
          padding: 15,
        },
      },
    },
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>{t('charts.notesByType')}</strong>
      </CCardHeader>
      <CCardBody>
        <div style={{ height: '250px' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </CCardBody>
    </CCard>
  )
}

// Graf: Aktivita podle dne
export const ActivityByDayChart = ({ data }) => {
  const { t } = useTranslation('dashboard')
  const { isDark } = useTheme()

  const chartData = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        label: t('charts.notes'),
        data: data.map((d) => d.count),
        backgroundColor: chartColors.info,
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        },
      },
    },
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>{t('charts.activityByDay')}</strong>
      </CCardHeader>
      <CCardBody>
        <div style={{ height: '200px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CCardBody>
    </CCard>
  )
}
