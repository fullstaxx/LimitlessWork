/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#5c6ac4', // You can choose your brand colors
        'secondary': '#7886d7',
      },
    },
  },
  plugins: [],
}