/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: "hsl(var(--color-brand) / <alpha-value>)",
        bg: "hsl(var(--color-bg) / <alpha-value>)",
        fg: "hsl(var(--color-fg) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)",
        "muted-fg": "hsl(var(--color-muted-fg) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)",
        danger: "hsl(var(--color-danger) / <alpha-value>)",
        warning: "hsl(var(--color-warning) / <alpha-value>)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      fontFamily: { sans: "var(--font-sans)" },
    },
  },
};
