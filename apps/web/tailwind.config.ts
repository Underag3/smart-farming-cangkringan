import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F2EADA",
        stone: "#DFD7C9",
        forest: {
          DEFAULT: "#20462B",
          pine: "#1A3822",
          obsidian: "#112617",
          sage: "#2F4032",
        },
        ink: {
          DEFAULT: "#303030",
          muted: "#5C584F",
          sage: "#ADB19F",
        },
        leaf: {
          DEFAULT: "#20462B",
          dark: "#1A3822",
          soft: "#E7E1D4",
        },
        canvas: "#DFD7C9",
        line: "rgba(48, 48, 48, 0.22)",
        soil: "#8D6E63",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "Times New Roman", "serif"],
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
