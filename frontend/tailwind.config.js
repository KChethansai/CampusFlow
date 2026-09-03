/** @type {import('tailwindcss').Config} */
export default {
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
        }
      }
    }
  },
  plugins: []
};
