/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fondamento', 'serif'],
        body: ['Yanone Kaffeesatz', 'sans-serif'],
      },
      colors: {
        paper: {
          50: '#fcfbf9',
          100: '#f9f8f6',
          200: '#f3f1ec',
          300: '#e8e5dc',
          400: '#d5d0c3'
        },
        ink: {
          500: '#524e4a',
          700: '#33302c',
          800: '#211f1c',
          900: '#141311'
        },
        memora: {
          claude: '#c85a32',
          gemini: '#2563eb',
          gpt: '#10b981',
          hindsight: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
