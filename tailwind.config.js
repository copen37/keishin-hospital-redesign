module.exports = {
  content: ["./src/**/*.{html,njk,md,js}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d9efff",
          500: "#1f6aa5",
          700: "#145280",
          900: "#0f3554"
        },
        accent: {
          500: "#2f9e8f"
        }
      },
      fontFamily: {
        sans: ["\"Noto Sans JP\"", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 53, 84, 0.08)"
      }
    }
  },
  plugins: []
};
