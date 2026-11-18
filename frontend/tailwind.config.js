/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#07090A',
          900: '#0C0E10',
          850: '#111316',
          800: '#16191D',
          700: '#1F2329',
          600: '#2C313A',
        },
        gold: {
          300: '#E6CA85',
          400: '#D4AF37',
          500: '#C5A059',
          600: '#A88438',
          700: '#8A6824',
        },
        ivory: {
          50: '#FAFAF7',
          100: '#F4F2EB',
          200: '#E7E4D8',
          300: '#D5D1C1',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
