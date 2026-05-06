/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        ember: "#f97316",
        plum: "#5b21b6"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(249, 115, 22, 0.28)"
      }
    }
  },
  plugins: []
};
