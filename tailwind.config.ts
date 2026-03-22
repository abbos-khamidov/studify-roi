import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      colors: {
        studify: {
          orange: "#f97316",
        },
      },
      boxShadow: {
        studify: "var(--shadow)",
      },
      borderRadius: {
        card: "var(--card-radius)",
        pill: "var(--btn-radius)",
      },
    },
  },
  plugins: [],
};
export default config;
