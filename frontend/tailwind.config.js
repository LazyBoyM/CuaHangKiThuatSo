/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#0066cc', // Apple Blue
          600: '#0071e3', // Apple Blue Hover
          700: '#004499',
          800: '#003377',
          900: '#002255',
        },
        gray: {
          50: '#fafafa',
          100: '#f5f5f7', // Apple Light Gray
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#aeaeb2',
          500: '#86868b', // Apple Secondary Text
          600: '#6e6e73',
          700: '#515154',
          800: '#313134',
          900: '#1d1d1f', // Apple Primary Text
        },
        success: '#34c759',
        warning: '#ff9f0a',
        danger: '#ff3b30',
        info: '#0066cc',
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'apple-sm': '0 2px 12px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)',
        'apple-md': '0 4px 20px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03)',
        'apple-lg': '0 12px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
      },
      borderRadius: {
        'apple-sm': '12px',
        'apple': '18px',
        'apple-lg': '24px',
        'apple-xl': '32px',
      },
      backdropBlur: {
        'apple': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'blob': 'blob 10s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(40px, -60px) scale(1.1)" },
          "66%": { transform: "translate(-30px, 30px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        }
      }
    },
  },
  plugins: [],
}