/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enables toggling dark mode manually using a "dark" class on the <html> tag
  darkMode: 'class', 
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      // 1. Custom Fonts (Maps to your globals.css @font-face)
      fontFamily: {
        heading: ['CustomHeading', 'sans-serif'],
        sans: ['CustomBody', 'sans-serif'],
      },
      
      // 2. Custom Semantic Colors (Ensures your existing dashboard code doesn't break)
      colors: {
        background: '#f8fafc', // slate-50
        surface: {
          DEFAULT: '#ffffff', // white
          light: '#e2e8f0',   // slate-200
          lighter: '#f1f5f9', // slate-100
        },
        text: {
          main: '#0f172a',    // slate-900
          muted: '#64748b',   // slate-500
        },
        primary: '#1E3A8A',   // blue-900
      },

      // 3. Optional: Custom animations for your interactive UI
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};