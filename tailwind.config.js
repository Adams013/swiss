/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",   // Tailwind blue
        secondary: "#8B5CF6", // Tailwind purple
        accent: "#F59E0B",    // Tailwind amber
        background: "#F8FAFC", // light gray
        dark: "#1E293B",      // dark navy
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 8px rgba(0, 0, 0, 0.1)",
        hover: "0 8px 16px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};
