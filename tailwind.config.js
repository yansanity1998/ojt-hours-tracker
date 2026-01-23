/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d120c', // Deeper Dark Olive
          light: '#1a2517', // Deep Olive
          dark: '#050805',
        },
        secondary: {
          sage: '#ACC8A2',
          olive: '#1a2517',
          peach: '#FFB88C',
          blue: '#B8D4FF',
          pink: '#FFB3E6',
          yellow: '#FFE68C',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
