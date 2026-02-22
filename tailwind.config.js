/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0d0d12',
          800: '#16161e',
          700: '#1e1e28',
          600: '#262634',
          500: '#2e2e40',
          400: '#3a3a52',
        },
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        muted: '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
