/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        triage: {
          emergency: '#dc2626',
          urgent: '#ea580c',
          normal: '#16a34a',
          insufficient: '#eab308'
        }
      }
    },
  },
  plugins: [],
}
