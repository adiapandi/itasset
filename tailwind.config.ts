import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#16213E", // deep navy-indigo — primary text & headings
          soft: "#3A4A6B",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          sunken: "#F6F7F9", // page background
        },
        border: "#E3E6EC",
        accent: {
          DEFAULT: "#2F6F4E", // muted forest green — primary action / "verified" feel
          soft: "#E7F0EA",
        },
        warn: {
          DEFAULT: "#B8860B",
          soft: "#FBF3DF",
        },
        danger: {
          DEFAULT: "#B3441E",
          soft: "#FBEAE3",
        },
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
} satisfies Config;
