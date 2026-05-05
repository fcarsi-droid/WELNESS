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
        primary: { DEFAULT: "#4CAF82", dark: "#389968", light: "#edfaf3" },
        pink: { 400: "#F472B6" },
        orange: { 400: "#FB923C" },
        purple: { 400: "#A78BFA" },
        teal: { 400: "#2DD4BF" },
        blue: { 400: "#60A5FA" },
      },
    },
  },
  plugins: [],
};
