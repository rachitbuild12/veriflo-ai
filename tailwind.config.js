/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: {
            50: '#F0F4F8',
            100: '#D9E2EC',
            200: '#BCCCDC',
            300: '#9FB3C8',
            400: '#627D98',
            500: '#334E68',
            600: '#243B53',
            700: '#1A2E46',
            800: '#102A43',
            850: '#0C1F33',
            900: '#071626',
            950: '#040D18',
          },
          teal: {
            50: '#F0FDFA',
            100: '#CCFBF1',
            200: '#99F6E4',
            300: '#5EEAD4',
            400: '#2DD4BF',
            500: '#0D9488',
            600: '#0F766E',
            700: '#115E59',
            800: '#134E4A',
            900: '#042F2E',
          },
          amber: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
          },
          slate: {
            850: '#151F30',
            900: '#0F172A',
            950: '#080E1A',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'gov': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'gov-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'gov-card': '0 10px 15px -3px rgba(10, 25, 47, 0.08), 0 4px 6px -4px rgba(10, 25, 47, 0.04)',
        'gov-glow': '0 0 15px -3px rgba(13, 148, 136, 0.25)',
      }
    },
  },
  plugins: [],
}
