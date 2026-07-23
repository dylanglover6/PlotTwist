/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Colors, fonts, radius, and shadow resolve to the CSS variables defined
      // in src/styles.css, so the whole theme is driven from one place.
      colors: {
        ink: "var(--color-ink)",
        ember: "var(--color-ember)",
        plum: "var(--color-plum)",
        void: "var(--color-void)",
        aubergine: "var(--color-aubergine)",
        purple: "var(--color-purple)",
        magenta: "var(--color-magenta)",
        gold: "var(--color-gold)",
        yellow: "var(--color-yellow)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"]
      },
      borderRadius: {
        card: "var(--radius-card)"
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        "glow-gold": "var(--shadow-glow-gold)"
      }
    }
  },
  plugins: []
};
