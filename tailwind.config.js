/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          50: '#f0f4ff',
          100: '#dbe4fe',
          200: '#bfd0fe',
          300: '#93b4fd',
          400: '#608efa',
          500: '#3b6cf6',
          600: '#254deb',
          700: '#1d3bc8',
          800: '#1e33a2',
          900: '#1e2f80',
          950: '#0c133a',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          glow: '#6366f1'
        },
        dark: {
          surface: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          hover: '#293548'
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
