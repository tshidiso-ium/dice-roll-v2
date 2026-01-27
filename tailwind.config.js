/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        boardIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px) scale(0.95)",
            // boxShadow: "0 0 0 rgba(255, 215, 0, 0)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
            // boxShadow: "0 0 20px rgba(255, 215, 0, 0.4)",
          },
        },
        boardOut: {
          "0%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "100%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
        },
      },
      animation: {
        "board-in": "boardIn 0.6s ease-out forwards",
        "board-out": "boardOut 0.4s ease-in forwards",
      },
    },
  },
  plugins: [],
};