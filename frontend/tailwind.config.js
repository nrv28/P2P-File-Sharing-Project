/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['SFMono-Regular', 'Menlo', 'monospace'],
        roboto: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        openSans: ['"Open Sans"', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
      },
      colors: {
        sky: {
          light: '#E0F2FE',
          DEFAULT: '#38BDF8',
          dark: '#0EA5E9',
        },
        blue: {
          light: '#BFDBFE',
          DEFAULT: '#3B82F6',
          dark: '#1E3A8A',
        },
      },
    },
  },
  plugins: [],
}

