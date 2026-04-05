import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    { pattern: /^bg-(blossom|ocean|new-leaf|breeze)\/\d+$/ },
    { pattern: /^text-(blossom|ocean|new-leaf|breeze)$/ },
    { pattern: /^border-(blossom|ocean|new-leaf|breeze)\/\d+$/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
        // Glacial Indifference — self-host by placing font files in /public/fonts/
        // Download: https://www.fontsquirrel.com/fonts/glacial-indifference
        sub: ["'Glacial Indifference'", "Nunito", "system-ui", "sans-serif"],
        mono: ["monospace"],
      },
      colors: {
        galaxy: {
          DEFAULT: "#10213C",
          light: "#1a2d4a",
          lighter: "#203354",
        },
        "new-leaf": {
          DEFAULT: "#D6DE23",
          dark: "#b8bf1c",
        },
        breeze: "#BAE0C6",
        ocean: "#3B8EA5",
        blossom: "#F0AB86",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out both",
        "slide-up": "slideUp 0.35s ease-out both",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
