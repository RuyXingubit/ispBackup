/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020817",
        foreground: "#f8fafc",
        primary: "#3b82f6",
        card: "#0f172a",
        border: "#1e293b",
      },
    },
  },
  plugins: [],
}
