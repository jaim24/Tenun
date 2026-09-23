import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "umbra-canvas": "#0D0D0E",
        "graphite-panel": "#161618",
        "ash-rise": "#1E1E21",
        "foam-ink": "#F4F4F5",
        "slate-mute": "#A1A1AA",
        "dim-veil": "#70707A",
        "ember": "#E8633C",
        "ember-bright": "#FF7B54",
        "healthy-lime": "#4ADE80",
        "caution-amber": "#FBBF24",
        "coral-alert": "#F87171",
        "hairline": "rgba(244, 244, 245, 0.08)",
        "hairline-subtle": "rgba(244, 244, 245, 0.04)",
        "surface-container-high": "#2A2A2B",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "Geist", "sans-serif"],
        headline: ["var(--font-geist)", "Geist", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "monospace"],
      },
      fontSize: {
        "headline-xl": ["2.25rem", { lineHeight: "2.75rem", fontWeight: "600", letterSpacing: "-0.03em" }],
        "headline-lg": ["1.5rem", { lineHeight: "2rem", fontWeight: "600", letterSpacing: "-0.02em" }],
        "headline-md": ["1.125rem", { lineHeight: "1.5rem", fontWeight: "500", letterSpacing: "-0.015em" }],
        "body-editorial": ["0.9375rem", { lineHeight: "1.5rem", letterSpacing: "-0.005em" }],
        "body-dense": ["0.8125rem", { lineHeight: "1.25rem" }],
        "label-ui": ["0.75rem", { lineHeight: "1rem", fontWeight: "500", letterSpacing: "0.02em" }],
        "label-mono": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0" }],
        "data-metric": ["1.125rem", { lineHeight: "1.25rem", fontWeight: "500", letterSpacing: "-0.01em" }],
        "data-metric-lg": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "600", letterSpacing: "-0.02em" }],
        "data-mono-xs": ["0.6875rem", { lineHeight: "0.875rem", letterSpacing: "0.02em" }],
      },
      animation: {
        "breathing-dot": "breathing 2.4s ease-in-out infinite",
        "toast-in": "toast-in 0.22s cubic-bezier(0.21, 1.02, 0.73, 1) both",
      },
      keyframes: {
        breathing: {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.96)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [forms, containerQueries],
};

export default config;