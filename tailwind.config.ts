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
          navy: "#0A2540",
          "navy-dark": "#051626",
          "navy-light": "#13375c",
          orange: "#FF6900",
          "orange-dark": "#D95700",
          "orange-light": "#FFF2E8",
          blue: "#0284C7",
          red: "#CF2E2E",
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
