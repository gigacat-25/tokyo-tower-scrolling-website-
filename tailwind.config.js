/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          light: '#FCFAF7',
          DEFAULT: '#F9F6F0',
          dark: '#F0ECE3',
        },
        sky: {
          light: '#A3BFC7',
          DEFAULT: '#82A6B1',
          dark: '#5E818C',
        },
        rust: {
          light: '#F05D3D',
          DEFAULT: '#E03C1B',
          dark: '#B0290E',
        },
        navy: {
          DEFAULT: '#0F172A',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        title: ['"Syne"', 'sans-serif'],
      },
      animation: {
        'scroll-down': 'scroll-down 2s ease-in-out infinite',
      },
      keyframes: {
        'scroll-down': {
          '0%, 100%': { transform: 'translateY(0) scaleY(1)', opacity: 0.3 },
          '50%': { transform: 'translateY(8px) scaleY(1.2)', opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
