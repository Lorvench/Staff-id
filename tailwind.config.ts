import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral premium base
        ink: {
          DEFAULT: "#0f1115",
          soft: "#3a3f4b",
          muted: "#8a909c",
          faint: "#c7ccd6",
        },
        paper: {
          DEFAULT: "#ffffff",
          soft: "#f6f7f9",
          sunken: "#eef0f4",
        },
        // Single brand accent — buttons + QR frame only (LHP gold/bronze)
        brand: {
          DEFAULT: "#8a6420",
          soft: "#f3e9d3",
        },
        // Status colors — the only saturated color on the page
        active: {
          DEFAULT: "#16a34a",
          soft: "#dcfce7",
          ink: "#166534",
        },
        disengaged: {
          DEFAULT: "#dc2626",
          soft: "#fee2e2",
          ink: "#991b1b",
        },
        /**
         * Verdict surfaces for the public scan page. Deep enough to carry white
         * text at 10:1+, saturated enough that the answer registers as colour
         * before any word is read.
         */
        verdict: {
          active: "#0d4a37",
          "active-ink": "#a7e8c9",
          invalid: "#5e1c1c",
          "invalid-ink": "#f6b9b9",
          unknown: "#24272d",
          "unknown-ink": "#c7ccd6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,17,21,0.04), 0 12px 32px -8px rgba(15,17,21,0.12)",
        "card-lg": "0 2px 4px rgba(15,17,21,0.05), 0 24px 56px -12px rgba(15,17,21,0.18)",
      },
      keyframes: {
        "fade-scale-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "badge-pop": {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "60%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-scale-in": "fade-scale-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "badge-pop": "badge-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
