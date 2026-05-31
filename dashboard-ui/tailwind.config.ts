import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        mint: {
          50: "oklch(0.97 0.025 164)",
          100: "oklch(0.93 0.055 164)",
          300: "oklch(0.84 0.13 164)",
          400: "oklch(0.78 0.17 164)",
          500: "oklch(0.72 0.16 164)",
          900: "oklch(0.22 0.055 164)"
        },
        cyanx: {
          300: "oklch(0.78 0.13 198)",
          400: "oklch(0.68 0.17 198)",
          900: "oklch(0.21 0.05 218)"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(52, 244, 190, 0.22)",
        glass: "0 20px 70px rgba(3, 24, 36, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
