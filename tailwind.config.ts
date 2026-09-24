import type { Config } from "tailwindcss";

const colors = {
  // Neutral studio ground.
  paper: "#FFFFFF",
  card: "#F6F6F3",
  ink: "#0A0A08",
  muted: "#5C5C55",
  faint: "#9A9A92",
  // Thin structural rules.
  line: "#E8E8E3",
  lineStrong: "#C9C9C2",
  // The volt accent — the action, the stranger, the marks.
  signal: "#D8FF3D",
  signalHover: "#C2EC16",
  signalSoft: "#F6FFDD",
  signalText: "#5C6E00",
};

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        label: "0.08em",
      },
    },
  },
  plugins: [],
} satisfies Config;