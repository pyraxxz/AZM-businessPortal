/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'az-black':   '#08080c',
        'az-surface': '#0d0d14',
        'az-card':    '#11111a',
        'az-card-elevated': '#161620',
        'az-border':  '#1c1c28',
        'az-border-bright': '#28283a',
        'az-emerald': '#00d97e',
        'az-blue':    '#4f8ef7',
        'az-purple':  '#a78bfa',
        'az-amber':   '#f59e0b',
        'az-red':     '#f43f5e',
        'az-cyan':    '#00b8d9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        lg: '14px',
        md: '10px',
        sm: '7px',
      },
      keyframes: {
        'fade-in':   { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in':  { from: { transform: 'translateX(-10px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        'scale-in':  { from: { transform: 'scale(0.97)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        'pulse-dot': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in':   'fade-in 0.25s ease-out',
        'slide-in':  'slide-in 0.25s ease-out',
        'scale-in':  'scale-in 0.2s ease-out',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        shimmer:     'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}


