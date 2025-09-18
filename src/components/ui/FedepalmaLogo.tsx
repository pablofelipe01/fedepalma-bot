interface FedepalmLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
}

export default function FedepalmaLogo({ className = '', size = 'md' }: FedepalmLogoProps) {
  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Fondo circular */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#fedepalmaGradient)"
          stroke="#556B2F"
          strokeWidth="2"
        />
        
        {/* Palma estilizada */}
        <g transform="translate(50, 50)">
          {/* Tronco */}
          <rect
            x="-2"
            y="10"
            width="4"
            height="25"
            fill="#556B2F"
            rx="2"
          />
          
          {/* Hojas de palma */}
          <path
            d="M-25 -5 Q-15 -20 0 -15 Q15 -20 25 -5"
            stroke="#8FA31E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-20 0 Q-10 -15 0 -10 Q10 -15 20 0"
            stroke="#8FA31E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-15 5 Q-8 -10 0 -5 Q8 -10 15 5"
            stroke="#C6D870"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Frutos */}
          <circle cx="-8" cy="8" r="2" fill="#8FA31E" />
          <circle cx="8" cy="8" r="2" fill="#8FA31E" />
          <circle cx="0" cy="12" r="2" fill="#C6D870" />
        </g>
        
        {/* Gradiente */}
        <defs>
          <linearGradient id="fedepalmaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EFF5D2" />
            <stop offset="50%" stopColor="#C6D870" />
            <stop offset="100%" stopColor="#8FA31E" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Texto del logo para tamaños grandes */}
      {size === 'xl' && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="text-xs font-bold text-[#556B2F] text-center whitespace-nowrap">
            FEDEPALMA
          </div>
        </div>
      )}
    </div>
  )
}