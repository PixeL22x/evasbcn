/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'evas-pink': '#FF6B9D',
        'evas-purple': '#8B5FBF',
        'evas-blue': '#4ECDC4',
        'evas-yellow': '#FFE66D',
        'evas-orange': '#FF8E53',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'slide-in': 'slideIn 0.5s ease-out',
        'progress-fill': 'progressFill 0.7s ease-out',
      },
      transitionDuration: {
        '800': '800ms',
        '900': '900ms',
        '1000': '1000ms',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
      },
    },
  },
  plugins: [],
}
