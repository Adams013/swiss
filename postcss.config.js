module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ Correct Tailwind v4 PostCSS plugin
    autoprefixer: {}            // ✅ Still required for browser compatibility
  },
};
