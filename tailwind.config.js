/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Phase 2 Design System: Light-first 'liquid glass' ──
        // Light surface stack (default)
        'az-bg':            '#F7F5F2',
        'az-bg-alt':        '#FBFAF8',
        'az-surface':       'rgba(255,255,255,0.72)',
        'az-surface-solid': '#FFFFFF',
        'az-border':        'rgba(17,17,17,0.08)',
        'az-border-strong': 'rgba(17,17,17,0.14)',
        'az-text':           '#15141A',
        'az-text-secondary': '#5D5A66',
        'az-text-muted':     '#9A96A3',

        // Dark surface stack (toggleable)
        'az-bg-dark':        '#0F0E13',
        'az-surface-dark':   'rgba(30,28,38,0.65)',
        'az-border-dark':    'rgba(255,255,255,0.08)',

        // Accent
        'az-accent':         '#6C4FD1',
        'az-accent-hover':   '#7C61DD',
        'az-accent-subtle':  'rgba(108,79,209,0.10)',
        'az-accent-border':  'rgba(108,79,209,0.28)',

        // Semantic
        'az-success':        '#1FA37A',
        'az-success-subtle': 'rgba(31,163,122,0.10)',
        'az-warning':        '#E2A33D',
        'az-warning-subtle': 'rgba(226,163,61,0.12)',
        'az-danger':         '#E15361',
        'az-danger-subtle':  'rgba(225,83,97,0.10)',
        'az-info':           '#3D74DB',

        // ── Sentry v3 palette — deep indigo-black (NOT purple) ──
        'sn-black':          '#16141c',
        'sn-surface':        '#1a1822',
        'sn-elevated':       '#211f2a',
        'sn-hover':          '#272531',
        'sn-card':           '#1e1c26',
        'sn-card-hover':     '#25232f',
        'sn-border':         '#2a2732',
        'sn-border-hover':   '#36333f',
        'sn-border-bright':  '#3d3a47',

        // Text
        'sn-text':           '#f0f0f5',
        'sn-text-secondary': '#c6bdcf',
        'sn-text-muted':     '#776589',

        // Accents — purple constrained to buttons/active/progress only
        'sn-purple':         '#6C5FC7',
        'sn-purple-h':       '#7B70D4',
        'sn-purple-subtle':  '#6C5FC71a',
        'sn-purple-border':  '#6C5FC740',

        'sn-blue':           '#3D74DB',
        'sn-blue-subtle':    '#3D74DB1a',

        'sn-green':          '#33BF9E',
        'sn-green-subtle':   '#33BF9E1a',

        'sn-red':            '#F55459',
        'sn-red-subtle':     '#F554591a',
        'sn-red-solid':      '#F55459',

        'sn-amber':          '#FFC227',
        'sn-amber-subtle':   '#FFC2271a',

        'sn-orange':         '#FF7738',
        'sn-pink':           '#F05781',

        // Legacy aliases (backward compat)
        'az-black':          '#16141c',
        'az-card':           '#1e1c26',
        'az-card-elevated':  '#211f2a',
        'az-border-bright':  '#3d3a47',
        'az-emerald':        '#33BF9E',
        'az-blue':           '#3D74DB',
        'az-purple':         '#6C5FC7',
        'az-amber':          '#FFC227',
        'az-red':            '#F55459',
        'az-cyan':           '#3D74DB',

        // ── shadcn/ui compatibility (mapped to CSS vars → Sentry theme) ──
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        lg: '12px',
        md: '10px',
        sm: '8px',
        'az-lg': '20px',
        'az-md': '14px',
        'az-sm': '10px',
        'az-pill': '999px',
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      boxShadow: {
        'az-card':      '0 1px 2px rgba(17,17,17,0.04), 0 8px 24px -8px rgba(17,17,17,0.08)',
        'az-card-hover':'0 4px 16px rgba(17,17,17,0.06), 0 16px 40px -12px rgba(17,17,17,0.14)',
        'az-glass':     '0 8px 32px rgba(17,17,17,0.10), inset 0 1px 0 rgba(255,255,255,0.4)',
        'az-modal':     '0 24px 64px rgba(17,17,17,0.24), 0 0 0 1px rgba(17,17,17,0.06)',
        'az-focus':     '0 0 0 3px rgba(108,79,209,0.18)',

        'sn-button':        '0 1px 2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
        'sn-button-active': '0 0 0 rgba(0,0,0,0), inset 0 1px 2px rgba(0,0,0,0.3)',
        'sn-dropdown':      '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,95,199,0.1)',
        'sn-modal':         '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,95,199,0.15)',
        'sn-card':          '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(42,39,50,0.5)',
        'sn-card-hover':    '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(108,95,199,0.2)',
        'sn-input-focus':   '0 0 0 3px rgba(108,95,199,0.15)',
        'sn-glow':          '0 0 20px rgba(108,95,199,0.15)',
        'sn-tooltip':       '0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,95,199,0.1)',
      },
      keyframes: {
        'fade-in':   { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in':  { from: { transform: 'translateX(-10px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'scale-in':  { from: { transform: 'scale(0.97)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        'phone-in':  { from: { transform: 'scale(0.92)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        'pulse-dot': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in':   'fade-in 0.25s ease-out',
        'slide-in':  'slide-in 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in':  'scale-in 0.2s ease-out',
        'phone-in':  'phone-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        shimmer:     'shimmer 1.6s linear infinite',
      },
      transitionTimingFunction: {
        'sn-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'sn-ease':   'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
