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
        coach: {
          bg: "#f8f7f2",
          text: "#1f2a2a",
          card: "#ffffff",
          accent: "#0e7a6f",
          accentAlt: "#ff7b2c",
          muted: "#5f6b6b"
        }
      },
      boxShadow: {
        card: "0 12px 28px rgba(16, 42, 41, 0.08)"
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
        rise: "rise 300ms ease-out",
        pulseGlow: "pulseGlow 2.2s infinite"
      }
    }
  },
  plugins: []
};

export default config;
