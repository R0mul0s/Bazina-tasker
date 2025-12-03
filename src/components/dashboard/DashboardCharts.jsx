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
  const { isDark } = useTheme()

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Poznámky',
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
        <strong>Poznámky za týden</strong>
        <small className="text-secondary ms-2">(posledních 8 týdnů)</small>
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
  const { isDark } = useTheme()

  if (data.length === 0) {
    return (
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Čas strávený s zákazníky</strong>
        </CCardHeader>
        <CCardBody className="text-center text-secondary py-4">
          Zatím žádné záznamy o stráveném čase
        </CCardBody>
      </CCard>
    )
  }

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: 'Hodiny',
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
        <strong>Čas strávený s zákazníky</strong>
        <small className="text-secondary ms-2">(top 5, v hodinách)</small>
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
  const { isDark } = useTheme()

  if (data.length === 0) {
    return (
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Poznámky podle typu</strong>
        </CCardHeader>
        <CCardBody className="text-center text-secondary py-4">
          Zatím žádné poznámky
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
        <strong>Poznámky podle typu</strong>
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
  const { isDark } = useTheme()

  const chartData = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        label: 'Poznámky',
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
        <strong>Aktivita podle dne</strong>
      </CCardHeader>
      <CCardBody>
        <div style={{ height: '200px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CCardBody>
    </CCard>
  )
}
