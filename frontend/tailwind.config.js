/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#168447',
          deep: '#106B39',
          soft: '#E8F5E9',
          bg: '#FFFFFF',
          secondary: '#F7FAF7',
          text: '#17251C',
          muted: '#738078',
          offer: '#F5A623',
          50: '#f0fdf4',
          100: '#E8F5E9',
          200: '#c8e6c9',
          300: '#a5d6a7',
          400: '#81c784',
          500: '#168447',
          600: '#106B39',
          700: '#0c522b',
        },
        primary: {
          50: '#f0fdf4',
          100: '#E8F5E9',
          200: '#c8e6c9',
          300: '#a5d6a7',
          400: '#81c784',
          500: '#168447',
          600: '#106B39',
          700: '#0c522b',
          800: '#083c1f',
        },
        grocery: {
          dark: '#17251C',
          muted: '#738078',
          lightBg: '#F7FAF7',
          accent: '#F5A623',
          green: '#168447',
          greenDeep: '#106B39',
          greenSoft: '#E8F5E9',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(22, 132, 71, 0.06)',
        'card': '0 1px 4px rgba(23, 37, 28, 0.06), 0 4px 12px rgba(23, 37, 28, 0.04)',
        'card-hover': '0 4px 20px rgba(22, 132, 71, 0.12), 0 1px 3px rgba(23, 37, 28, 0.06)',
        'elevated': '0 10px 30px -5px rgba(23, 37, 28, 0.1)',
        'bottom-nav': '0 -2px 12px rgba(23, 37, 28, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
