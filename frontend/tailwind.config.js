/** @type {import('tailwindcss').Config} */
// tailwind.config.js
// Scans all JSX files for class names to include in the build.

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Custom opacity utilities used across the app
      backgroundOpacity: { 8: '0.08', 12: '0.12' },
    },
  },
  plugins: [],
};
