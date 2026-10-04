import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f6f2",
        ink: "#1c1f1d",
        brand: { DEFAULT: "#3b6e4f", dark: "#2d5640", soft: "#e6efe9" },
        loss: "#b4472f",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
