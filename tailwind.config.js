/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#EEF2FA",
          dark: "#0F1420",
          "dark-raised": "#141B29",
        },
        bg: {
          DEFAULT: "#EEF2FA",
          dark: "#080B12",
        },
        border: {
          DEFAULT: "#DCE3F0",
          strong: "#C1CCE0",
          dark: "#212A3B",
          "dark-strong": "#2E3A52",
        },
        accent: {
          DEFAULT: "#0C8599",
          dark: "#2DE2E6",
        },
        onGoing: {
          DEFAULT: "#0C8599",
          dark: "#2DE2E6",
        },
        pending: {
          DEFAULT: "#B4690E",
          dark: "#FFB84D",
        },
        done: {
          DEFAULT: "#0E8F63",
          dark: "#3DF2A2",
        },
        danger: {
          DEFAULT: "#D33A56",
          dark: "#FF5C7A",
        },
        priorityP0: {
          DEFAULT: "#DC2626",
          dark: "#FF6B6B",
        },
        priorityP1: {
          DEFAULT: "#EA580C",
          dark: "#FFA94D",
        },
        priorityP2: {
          DEFAULT: "#CA8A04",
          dark: "#FFD43B",
        },
        priorityP3: {
          DEFAULT: "#16A34A",
          dark: "#69DB7C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
