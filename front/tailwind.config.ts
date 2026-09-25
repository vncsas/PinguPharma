import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF1FF",
          100: "#DDE3FF",
          200: "#B8C3FF",
          300: "#8B9BFF",
          400: "#5A70FA",
          500: "#2A4BF0",
          600: "#1E3AD6",
          700: "#182FA8",
          800: "#132585",
          900: "#0F1D66",
        },
        ink: {
          DEFAULT: "#0A0F1E",
          soft: "#1F2A44",
          muted: "#5B6478",
          subtle: "#8A93A6",
        },
        line: {
          DEFAULT: "#E8EAF0",
          strong: "#D5D9E3",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F5F7FB",
          canvas: "#F1F3F9",
        },
        accent: {
          orange: "#F58220",
          amber: "#F5B424",
          teal: "#00B69A",
          rose: "#EF4A5F",
          success: "#12B76A",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
        soft: "0 4px 16px -6px rgba(15, 23, 42, 0.08)",
        pop: "0 12px 32px -12px rgba(15, 23, 42, 0.16)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
