/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0A0E14',        // near-black terminal background
          panel: '#0F1620',     // slightly lighter panel bg
          border: '#1E2A36',    // hairline borders
          text: '#C9D6E3',      // primary text (cool grey-blue, not pure white)
          muted: '#5A7185',     // secondary text
          accent: '#3FE0C5',    // signal teal — the one bright accent
          critical: '#FF4D5E',
          high: '#FF9F43',
          medium: '#F5D547',
          low: '#4C9EF1',
          info: '#5A7185',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
