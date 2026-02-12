/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        foreground: '#FAFAFA',
        card: '#18181B',
        'card-foreground': '#FAFAFA',
        primary: '#3B82F6',
        'primary-foreground': '#FFFFFF',
        secondary: '#27272A',
        'secondary-foreground': '#FAFAFA',
        muted: '#27272A',
        'muted-foreground': '#A1A1AA',
        accent: '#27272A',
        'accent-foreground': '#FAFAFA',
        destructive: '#EF4444',
        border: '#27272A',
        input: '#27272A',
        ring: '#3B82F6',
        profit: '#10B981',
        loss: '#EF4444',
      },
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
    },
  },
  plugins: [],
}