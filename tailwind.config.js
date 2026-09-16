/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        charcoal: {
          50: '#f5f6f7',
          100: '#e6e8ea',
          200: '#c4c8cd',
          300: '#9ba1a8',
          400: '#6b7278',
          500: '#4a5056',
          600: '#363b40',
          700: '#272b2f',
          800: '#1a1d20',
          900: '#101213',
          950: '#08090a',
        },
        aluminum: {
          50: '#f9fafa',
          100: '#f0f1f2',
          200: '#e2e3e5',
          300: '#c8cacc',
          400: '#a8abae',
          500: '#8b8f93',
          600: '#737679',
          700: '#5c5e61',
          800: '#454749',
          900: '#2e2f31',
        },
        ice: {
          50: '#eef7fb',
          100: '#d4ecf4',
          200: '#aedae9',
          300: '#7ac0db',
          400: '#47a3c9',
          500: '#2a89b0',
          600: '#1f6e91',
          700: '#1a5874',
          800: '#17475e',
          900: '#143b4f',
        },
      },
      backgroundImage: {
        'brushed-metal': 'linear-gradient(135deg, #e2e3e5 0%, #c8cacc 25%, #a8abae 50%, #c8cacc 75%, #e2e3e5 100%)',
        'charcoal-gradient': 'linear-gradient(180deg, #1a1d20 0%, #101213 100%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
