/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Colors, radius, and shadow resolve to the CSS variables defined in
      // src/styles.css, so the whole theme is driven from one place.
      colors: {
        ink: "var(--color-ink)",
        ember: "var(--color-ember)",
        plum: "var(--color-plum)"
      },
      borderRadius: {
        card: "var(--radius-card)"
      },
      boxShadow: {
        glow: "var(--shadow-glow)"
      }
    }
  },
  plugins: []
};
