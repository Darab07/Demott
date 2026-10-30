import type { Config } from "tailwindcss";

// TableTap design tokens, taken from the Figma "TableTap-Website" file.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#faf9f6", // screen background
        ink: "#001814", // primary text
        "ink-muted": "rgba(0,24,20,0.60)", // secondary text
        plum: "#390e5e", // brand / icon tiles
        hairline: "rgba(17,17,17,0.15)", // card borders
        star: "#fdcc0d", // rating star
        "icon-muted": "#667472", // small meta icons
      },
      fontFamily: {
        // Satoshi only (loaded from Fontshare in index.html).
        sans: ["Satoshi", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        phone: "402px",
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "step-in": {
          from: { opacity: "0", transform: "translateX(var(--step-from, 16px))" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        nudge: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-3px)" },
          "80%": { transform: "translateX(3px)" },
        },
        // Order tracking bar: a finished step fills in, the current one keeps
        // filling and fading while it's in progress.
        "bar-fill": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "bar-live": {
          "0%": { transform: "scaleX(0)", opacity: "1" },
          "70%": { transform: "scaleX(1)", opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "0" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "toast-in": "toast-in 200ms ease-out",
        pop: "pop 320ms ease-out",
        nudge: "nudge 360ms ease-in-out",
        "step-in": "step-in 220ms ease-out",
        "bar-fill": "bar-fill 550ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "bar-live": "bar-live 2200ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
