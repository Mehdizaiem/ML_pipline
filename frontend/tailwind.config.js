/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}", // Add this for Tremor
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
  // Add Tremor colors and sizes
  safelist: [
    {
      pattern: /^(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:\d+)$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern: /^(ring|border|divide)-(.*)$/,
      variants: ['hover', 'focus'],
    },
    {
      pattern: /^(w|h)-(.*)$/,
    },
  ],
}
