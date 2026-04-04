/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // A deep, premium dark background (not pure black)
        background: '#09090b',
        surface: '#18181b',
        surfaceBorder: '#27272a',
        
        // A striking neon violet/teal for our primary buttons and accents
        primary: {
          DEFAULT: '#8b5cf6', // Violet
          hover: '#7c3aed',
          foreground: '#ffffff',
        },
        
        // Muted text for secondary information
        muted: '#a1a1aa',
        
        // Incident Status Colors
        status: {
          error: '#ef4444',   // Red
          warning: '#f59e0b', // Amber
          success: '#10b981', // Green
          info: '#3b82f6',    // Blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // We will add the Inter font next!
      },
    },
  },
  plugins: [],
}