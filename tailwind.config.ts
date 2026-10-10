import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        purechem: {
          navy: "#0084C7",
          "navy-dark": "#006CA6",
          "navy-light": "#E0F2FE",
          blue: "#0084C7",
          "blue-dark": "#006CA6",
          "blue-light": "#E0F2FE",
          cyan: "#0EA5E9",
          sky: "#F0F9FF",
          orange: "#0084C7", // Remap accent to brand blue
          "orange-dark": "#006CA6",
          "orange-light": "#E0F2FE",
          red: "#DC2626",
          "red-light": "#FEE2E2",
          green: "#059669",
          "green-light": "#D1FAE5",
          amber: "#D97706",
          "amber-light": "#FEF3C7",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
