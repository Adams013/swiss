module.exports = {
  style: {
    postcss: {
      plugins: [
        require('@tailwindcss/postcss'), // ✅ Tailwind v4 plugin
        require('autoprefixer'),
      ],
    },
  },
};
