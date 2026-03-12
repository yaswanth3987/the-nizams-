/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme_gold: '#C6A566',
        theme_cream: '#F4ECD0',
        theme_orange: '#D46300',
        theme_brown: '#5E3A1A',
        primary: '#0B3A2E',
        secondary: '#0F4A3A',
        accent: '#C9A44C',
        text: '#F5F2EA'
      }
    },
  },
  plugins: [],
}
