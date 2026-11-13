/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{ts,tsx}'] },
  theme: {
    extend: {
      colors: {
        ink: '#060c11',
        panel: '#0b151c',
        raised: '#102029',
        line: '#1a2f39',
        mist: '#8aa3ad',
        haze: '#c9dbe0',
        teal: { DEFAULT: '#2ee6d0', dim: '#1a8c80' },
        cyan: { DEFAULT: '#46c2ff' },
        ok: '#43e08f',
        warn: '#f6b84a',
        crit: '#ff5d6c',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
