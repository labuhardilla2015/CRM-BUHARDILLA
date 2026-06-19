/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rojo corporativo de La Buhardilla del Marketing
        brand: {
          DEFAULT: '#aa0c0c',
          dark: '#860909',
          light: '#d11414',
        },
        // Negro de la barra lateral
        sidebar: {
          DEFAULT: '#0a0a0a',
          hover: '#1c1c1c',
        },
      },
    },
  },
  plugins: [],
};
