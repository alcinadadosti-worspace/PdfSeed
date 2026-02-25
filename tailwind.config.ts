import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema Natureza - Cores Pastéis
        cream: {
          50: '#fefef9',
          100: '#fdfcf3',
          200: '#faf8e8',
          300: '#f5f2dc',
          400: '#ebe5c9',
        },
        sage: {
          50: '#f6f9f6',
          100: '#e8f0e8',
          200: '#d4e4d4',
          300: '#b8d4b8',
          400: '#94bd94',
          500: '#6fa06f',
          600: '#558855',
          700: '#466e46',
          800: '#3a5a3a',
          900: '#2d472d',
        },
        leaf: {
          DEFAULT: '#5a9a5a',
          light: '#7db87d',
          dark: '#3d7a3d',
          muted: '#8fc68f',
        },
        earth: {
          100: '#f5f0eb',
          200: '#e8ddd1',
          300: '#d4c4b0',
          400: '#b8a088',
        },
        // Mantendo compatibilidade com nomes antigos para transição
        dark: {
          900: '#fefef9',
          800: '#fdfcf3',
          700: '#faf8e8',
          600: '#e8f0e8',
          500: '#d4e4d4',
        },
        accent: {
          DEFAULT: '#5a9a5a',
          hover: '#4a8a4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
