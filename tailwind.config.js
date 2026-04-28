/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx,js,jsx,nvue,nthml,axml}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0f0f12',
        card: '#1a1a20',
        muted: '#8b8b9a',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
