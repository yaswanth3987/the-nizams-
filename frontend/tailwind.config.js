/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        theme_gold: '#C6A566',
        theme_cream: '#F4ECD0',
        theme_orange: '#D46300',
        theme_brown: '#5E3A1A',
        primary: '#0B3A2E',
        secondary: '#0F4A3A',
        accent: '#C9A44C',
        text: '#F5F2EA',
        nizam: {
          dark: '#111312',
          sidebar: '#0f1110',
          card: '#1c1e1c',
          cardDark: '#161816',
          border: '#2a2d28',
          gold: '#c6a87c',
          goldDark: '#a38a64',
          goldMuted: '#5c503b',
          green: '#064e3b',
          greenDark: '#022c22',
          red: '#7f1d1d',
          text: '#f3f4f6',
          textMuted: '#9ca3af',
        }
      },
      keyframes: {
        'kitchen-fly-up': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-120px) scale(0.8)', opacity: '0' },
        }
      },
      animation: {
        'kitchen-fly-up': 'kitchen-fly-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      }
    },
  },
  plugins: [],
}
