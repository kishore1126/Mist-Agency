/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1d5fa7',
          darkBlue: '#154882',
          lightBlue: '#eef5fc',
          green: '#74b72e',
        }
      }
    },
  },
  plugins: [],
}
