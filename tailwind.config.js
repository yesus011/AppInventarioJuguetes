/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/front/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c2925",
        moss: "#557263",
        lime: "#d8ef72",
        paper: "#f4f4ed",
        line: "#dfe3d9",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 40px rgba(28, 41, 37, 0.08)",
      },
    },
  },
  plugins: [],
};