import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F5F2",
        line: "#E0E4DD",
        ink: "#17262A",
        muted: "#5D6E6B",
        side: "#10282A",
        brand: { DEFAULT: "#0F6B62", dark: "#0B4F49", soft: "#E1F0EC" },
        amber: { DEFAULT: "#9A6410", soft: "#FBF0D9" },
        danger: { DEFAULT: "#B4352D", soft: "#FBE7E4" },
        ok: { DEFAULT: "#2B7449", soft: "#E2F1E7" },
      },
      fontFamily: { sans: ["var(--font-figtree)", "ui-sans-serif", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
