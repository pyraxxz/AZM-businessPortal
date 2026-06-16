/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'az-black':   '#0a0a0f',
        'az-surface': '#0f0f17',
        'az-card':    '#13131e',
        'az-border':  '#1e1e2e',
        'az-emerald': '#00d97e',
        'az-blue':    '#4f8ef7',
        'az-purple':  '#a78bfa',
        'az-amber':   '#f59e0b',
        'az-red':     '#f43f5e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '7px',
      },
      keyframes: {
        'fade-in':   { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in':  { from: { transform: 'translateX(-10px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        'scale-in':  { from: { transform: 'scale(0.96)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        'pulse-dot': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in':   'fade-in 0.3s ease-out',
        'slide-in':  'slide-in 0.25s ease-out',
        'scale-in':  'scale-in 0.2s ease-out',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        shimmer:     'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
