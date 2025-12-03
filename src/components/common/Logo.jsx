const Logo = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pozadí - gradient kruh */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Hlavní kruh */}
      <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />

      {/* Písmeno B stylizované jako checkbox s checkmarkem */}
      <path
        d="M14 12h12c4 0 7 3 7 7 0 2.5-1.5 4.5-3.5 5.5 2.5 1 4.5 3.5 4.5 6.5 0 4-3 7-7 7H14V12z"
        fill="white"
        fillOpacity="0.2"
      />

      {/* Checkmark uvnitř */}
      <path
        d="M17 24l5 5 10-12"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export const LogoMini = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradientMini" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="22" fill="url(#logoGradientMini)" />

      <path
        d="M14 24l7 7 14-16"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export default Logo
