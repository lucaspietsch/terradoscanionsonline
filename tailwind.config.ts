import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./scripts/single/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        musgo: { DEFAULT: "#2F3E2C", claro: "#3B4D37" },
        salvia: { DEFAULT: "#8A9A7B", clara: "#B7C2AA" },
        concreto: "#C9C5BD",
        nevoa: "#ECEAE5",
        pedra: "#F6F5F2",
        sombra: "#232A21",
        secundario: "#5C6657",
        erro: "#8C3B2E",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-jost)", "system-ui", "sans-serif"],
      },
      letterSpacing: { label: "0.28em", logo: "0.06em", logoSub: "0.5em" },
      borderRadius: { DEFAULT: "4px", sm: "2px", md: "4px", lg: "6px" },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        marquee: "marquee 45s linear infinite",
        "accordion-down": "accordion-down 0.25s ease-out",
        "accordion-up": "accordion-up 0.25s ease-out",
      },
    },
  },
  plugins: [animate],
};
export default config;
