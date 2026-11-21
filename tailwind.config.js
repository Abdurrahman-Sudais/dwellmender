import animate from "tailwindcss-animate";
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Plus Jakarta Sans"', "Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        navy: { 50: "#eef2f8", 100: "#d6dfee", 200: "#aebfdc", 300: "#7e97c2", 400: "#4f6ea3", 500: "#345285", 600: "#26406c", 700: "#1d3256", 800: "#172843", 900: "#13233f", 950: "#0b1528" },
        sage: { 50: "#f1f6f2", 100: "#dfeae1", 200: "#bfd5c4", 300: "#97b9a0", 400: "#6f9a7b", 500: "#567f62", 600: "#43654d", 700: "#375140", 800: "#2e4235", 900: "#26372d" },
        amber: { 50: "#fdf7ec", 100: "#faebcd", 200: "#f4d596", 300: "#edbb5e", 400: "#e0a43a", 500: "#c98623", 600: "#a8671b", 700: "#864d1a" },
        warm: { 50: "#fdfcfa", 100: "#faf7f2", 200: "#f3eee5", 300: "#e8e1d4" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      boxShadow: {
        card: "0 1px 2px rgba(19,35,63,0.04), 0 1px 3px rgba(19,35,63,0.06)",
        lift: "0 10px 30px -12px rgba(19,35,63,0.25)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      animation: { shimmer: "shimmer 1.4s linear infinite" },
    },
  },
  plugins: [animate],
};
