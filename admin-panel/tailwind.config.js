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
          50: '#fff4ed',
          100: '#ffe8d5',
          200: '#fecfaa',
          300: '#fdac74',
          400: '#fb7c3c',
          500: '#f95d16',
          600: '#ea420c',
          700: '#c2300c',
          800: '#9a2812',
          900: '#7c2312',
        },
        brand: {
          dark: '#1a1a2e',
          sidebar: '#16213e',
          card: '#0f3460',
          accent: '#e94560',
        },
      },
    },
  },
  plugins: [],
}