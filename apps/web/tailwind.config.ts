import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          DEFAULT: "#2E7D32",
          dark: "#1B5E20",
          soft: "#E8F5E9",
        },
        canvas: "#F7F9F4",
        ink: {
          DEFAULT: "#1C2B1A",
          muted: "#5A6B57",
        },
        soil: "#8D6E63",
        line: "#DDE5D8",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
