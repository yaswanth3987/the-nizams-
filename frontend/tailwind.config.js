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
        theme_gold: '#FFD700',
        theme_cream: '#F4ECD0',
        theme_orange: '#D46300',
        theme_brown: '#5E3A1A',
        primary: '#0F3A2F',
        secondary: '#0B2D24',
        accent: '#FFD700',
        text: '#F5F2EA',
        nizam: {
          dark: '#0e1111',
          sidebar: '#0c0d0c',
          card: '#111311',
          cardDark: '#0a0b0a',
          border: '#2a2d28',
          gold: '#FFD700',
          goldDark: '#FFC300',
          goldMuted: '#5c503b',
          green: '#0F3A2F',
          greenDark: '#0B2D24',
          red: '#7f1d1d',
          text: '#f3f4f6',
          textMuted: '#848a8a',
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
