import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#B45309', // woodfire accent
          dark: '#7C2D12',
          light: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
