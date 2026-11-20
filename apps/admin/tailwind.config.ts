import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          50: '#E8EEF5',
          100: '#C5D3E4',
          200: '#8AA6C4',
          300: '#4F79A4',
          400: '#2A4F78',
          500: '#0B1F3A',
          600: '#091830',
          700: '#071226',
          800: '#050C1C',
          900: '#030812',
        },
        teal: {
          DEFAULT: '#0D9488',
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
          pending: '#D97706',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F7FA',
          border: '#E5E9F0',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11, 31, 58, 0.06), 0 1px 2px rgba(11, 31, 58, 0.04)',
        elevated: '0 8px 24px rgba(11, 31, 58, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
