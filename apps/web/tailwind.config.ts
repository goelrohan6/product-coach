import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        text: "var(--color-text-primary)",
        muted: "var(--color-text-secondary)",
        border: "var(--color-border)",
        accent: "var(--color-accent)",
        accentAlt: "var(--color-accent-alt)",
        focus: "var(--color-focus)",
        coach: {
          bg: "var(--color-bg)",
          text: "var(--color-text-primary)",
          card: "var(--color-surface)",
          accent: "var(--color-accent)",
          accentAlt: "var(--color-accent-alt)",
          muted: "var(--color-text-secondary)"
        }
      },
      boxShadow: {
        card: "var(--shadow-sm)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(14,122,111,0.2)" },
          "50%": { boxShadow: "0 0 0 8px rgba(14,122,111,0)" }
        }
      },
      animation: {
        rise: "rise var(--dur-normal) var(--ease-standard)",
        pulseGlow: "pulseGlow 2.2s var(--ease-standard) infinite"
      }
    }
  },
  plugins: []
};

export default config;
