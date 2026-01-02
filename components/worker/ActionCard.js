'use client'

export function ActionCard({ icon, title, subtitle, onClick, gradient, badge }) {
    return (
        <button
            onClick={onClick}
            className={`
        relative bg-gradient-to-br ${gradient} 
        border border-white/10 rounded-2xl p-6 
        hover:scale-[1.02] active:scale-95
        transition-all duration-300 shadow-lg
        min-h-[140px] flex flex-col items-center justify-center
      `}
        >
            {/* Badge de notificación */}
            {badge && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}

            {/* Icon */}
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {icon}
            </div>

            {/* Title */}
            <div className="text-white font-semibold text-base text-center">
                {title}
            </div>

            {/* Subtitle */}
            {subtitle && (
                <div className="text-white/60 text-xs mt-1 text-center">
                    {subtitle}
                </div>
            )}
        </button>
    )
}
