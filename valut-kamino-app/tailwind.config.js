/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#F5F6FA',
          surface: '#FFFFFF',
          'surface-2': '#F0F1F7',
          border: '#E2E4EF',
          'border-strong': '#C8CADB',
          text: '#0D0D1A',
          muted: '#A1A1C2',
          secondary: '#5A5A7A',
          accent: '#783FE4',
          'accent-light': '#EEF0FF',
          card: '#FFFFFF',
        },
        health: {
          safe: '#16A34A',
          moderate: '#D97706',
          risk: '#EA580C',
          critical: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}
