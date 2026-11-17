/** @type {import('tailwindcss').Config} */
// Design tokens shared by every portal (Super Admin, Doctor, PG Scholar, HMS).
// `brand` and `emerald` point at CSS variables (--brand-50 … --brand-950) that the HMS theme engine
// (src/modules/hms/utils/theme.js) fills from the clinic's chosen colour. So every class such as
// bg-emerald-700 or text-brand-600 changes with the theme, and no screen needs its own colour code.
const shade = (k) => `rgb(var(--brand-${k}) / <alpha-value>)`;
const brand = {
  50: shade(50),
  100: shade(100),
  200: shade(200),
  300: shade(300),
  400: shade(400),
  500: shade(500),
  600: shade(600),
  700: shade(700),
  800: shade(800),
  900: shade(900),
  950: shade(950),
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    ringWidth: { DEFAULT: "1px", 0: "0", 1: "1px", 2: "2px", 3: "3px", 4: "4px", 8: "8px" },
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
        // HMS headings used a serif face; the new design uses Inter everywhere.
        serif: ['"Inter"', '"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        brand,
        // Neutral scale with a faint green tint (borders #dbe7df, page #f3f8f5, ink #0d2c20).
        stone: {
          50: "#f6faf7",
          100: "#edf4ef",
          200: "#dbe7df",
          300: "#c3d4c9",
          400: "#8ea398",
          500: "#64796e",
          600: "#4b6056",
          700: "#364a40",
          800: "#1e3a2d",
          900: "#0d2c20",
          950: "#07241a",
        },
        // The HMS "emerald" accents follow the same live clinic colour.
        emerald: brand,
        saffron: { 100: "#fdf0d2", 200: "#fbe2a4", 300: "#f8d072", 400: "#f4b740", 500: "#eaa21d", 600: "#c9830f" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,61,42,.05), 0 8px 24px -12px rgba(10,61,42,.12)",
        xs: "0 1px 2px rgba(10,61,42,.05)",
        "2xs": "0 1px 1px rgba(10,61,42,.04)",
        hero: "0 18px 40px -18px rgba(10,61,42,.55)",
      },
    },
  },
  plugins: [],
};
