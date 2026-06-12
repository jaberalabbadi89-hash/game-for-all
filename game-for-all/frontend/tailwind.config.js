/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0f',
          900: '#12121a',
          800: '#1f1f2e',
        },
        purple: {
          600: '#7c3aed',
          500: '#8b5cf6',
        },
        blue: {
          500: '#3b82f6',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.3)',
      }
    },
  },
  plugins: [],
}
