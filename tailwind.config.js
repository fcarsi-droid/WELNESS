/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Playfair Display'", "serif"],
      },
      colors: {
        primary: {
          50: "#f0f9f4",
          500: "#349668",
          600: "#257852",
          700: "#1e6143",
        },
      },
    },
  },
  plugins: [],
};
