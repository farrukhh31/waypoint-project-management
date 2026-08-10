/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Waypoint design tokens — see src/index.css for the rationale.
        // v2: a fuller, more saturated palette — a tinted background plus
        // five vivid hues (route, accent, success, danger, sky, teal) —
        // in place of the original mostly-white/blue treatment.
        // ink/paper/surface/line resolve through CSS variables (defined in
        // index.css) so the `dark` class can flip the whole app's
        // structural colors while every existing opacity-modified class
        // (bg-paper/40, text-ink-muted/50, ...) keeps working unchanged.
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)', // primary text
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)', // secondary text
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)', // tertiary / placeholder text
        },
        paper: 'rgb(var(--color-paper) / <alpha-value>)', // app background
        surface: 'rgb(var(--color-surface) / <alpha-value>)', // cards, panels
        line: 'rgb(var(--color-line) / <alpha-value>)', // hairline borders/dividers
        route: {
          50: '#EEF0FE',
          100: '#D9DDFC',
          200: '#B6BEFA',
          300: '#8D96F5',
          400: '#6C6FEE',
          500: '#5B4FE0', // primary brand — vivid indigo/violet, "the route"
          600: '#4A3DC4',
          700: '#3A2F9E',
          800: '#2A2274',
          900: '#1C1750',
        },
        accent: {
          50: '#FFF4E5',
          100: '#FFE1B8',
          200: '#FFC77A',
          300: '#FFA83D',
          400: '#FF8C1A', // waypoint marker — vivid orange
          500: '#F26B0A',
          600: '#C9540A',
          700: '#9E4009',
        },
        success: {
          50: '#E7FBEF',
          100: '#C3F5D8',
          200: '#8EEAB4',
          300: '#52DA8D',
          400: '#17B26A',
          500: '#0E9A58',
          600: '#0B7D47',
          700: '#096536',
        },
        danger: {
          50: '#FFEBEE',
          100: '#FFC9D1',
          200: '#FF98A8',
          300: '#F96280',
          400: '#F0324B',
          500: '#D91F3D',
          600: '#B01530',
          700: '#841026',
        },
        sky: {
          50: '#E6F7FF',
          100: '#B8ECFF',
          200: '#7CDBFF',
          300: '#38C4F5',
          400: '#12AEDE',
          500: '#0B8FBD',
          600: '#086F94',
          700: '#075670',
        },
        teal: {
          50: '#E6FBF6',
          100: '#B9F3E7',
          200: '#7EE7D2',
          300: '#3ED9BC',
          400: '#14C9A5',
          500: '#0DA98A',
          600: '#0A8A70',
          700: '#086E5A',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18, 23, 43, 0.04), 0 1px 8px rgba(18, 23, 43, 0.04)',
        pop: '0 8px 24px rgba(18, 23, 43, 0.12)',
      },
    },
  },
  plugins: [],
};
