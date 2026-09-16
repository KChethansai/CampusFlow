/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eaf4ff',
          100: '#d6e9ff',
          200: '#a8d0ff',
          300: '#66abff',
          400: '#3395ff',
          500: '#0071e3',
          600: '#0066cc',
          700: '#0055ad',
          800: '#00448c',
          900: '#003a75'
        },
        ink: {
          DEFAULT: '#1d1d1f',
          soft: '#3a3a3c',
          mute: '#6e6e73'
        },
        navy: {
          800: '#16233f',
          900: '#0e1830',
          950: '#0a1226'
        },
        graphite: {
          700: '#2c2c2e',
          800: '#1c1c1e',
          900: '#131315'
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#8b5cf6'
        },
        obsidian: {
          800: '#111c33',
          900: '#0a1226',
          950: '#020617'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        display: ["'Instrument Serif'", 'Georgia', 'serif']
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        pill: '999px'
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem'
      },
      boxShadow: {
        1: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)',
        2: '0 4px 12px -2px rgba(16,24,40,.10), 0 2px 6px -2px rgba(16,24,40,.06)',
        3: '0 12px 32px -8px rgba(16,24,40,.18), 0 4px 12px -4px rgba(16,24,40,.10)',
        4: '0 24px 64px -12px rgba(16,24,40,.28), 0 8px 24px -8px rgba(16,24,40,.14)',
        glow: '0 0 24px rgba(0,113,227,.35)',
        'glow-lg': '0 0 40px rgba(0,113,227,.45), 0 8px 32px -8px rgba(0,113,227,.35)',
        card: '0 1px 2px rgba(16,24,40,.06), 0 8px 24px -12px rgba(16,24,40,.18)'
      },
      keyframes: {
        beam: { from: { 'background-position': '0% 50%' }, to: { 'background-position': '200% 50%' } },
        shimmer: { from: { 'background-position': '200% 0' }, to: { 'background-position': '-200% 0' } },
        meteor: { '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' }, '70%': { opacity: '1' }, '100%': { transform: 'rotate(215deg) translateX(-500px)', opacity: '0' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-dot': { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.55', transform: 'scale(.82)' } }
      },
      animation: {
        beam: 'beam 5s linear infinite',
        shimmer: 'shimmer 2.8s linear infinite',
        meteor: 'meteor 5s linear infinite',
        marquee: 'marquee 28s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
