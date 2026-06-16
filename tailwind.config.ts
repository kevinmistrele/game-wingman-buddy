import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import {
  fontFamily,
  fontSize,
  tierColorValues,
  statusColorValues,
  keyframes,
  tailwindAnimation,
  container,
  zIndex,
  borderRadius,
} from "./src/design-system/tokens";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: container.padding,
      screens: { "2xl": container.maxWidth },
    },
    extend: {
      // ─── Typography ─────────────────────────────────────────────────────
      fontFamily,
      fontSize,

      // ─── Colors ─────────────────────────────────────────────────────────
      // Semantic colors reference CSS custom properties set in index.css.
      // Tier and status colors reference CSS vars generated from token values.
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT:    "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:            "hsl(var(--sidebar-background))",
          foreground:         "hsl(var(--sidebar-foreground))",
          primary:            "hsl(var(--sidebar-primary))",
          "primary-foreground":"hsl(var(--sidebar-primary-foreground))",
          accent:             "hsl(var(--sidebar-accent))",
          "accent-foreground":"hsl(var(--sidebar-accent-foreground))",
          border:             "hsl(var(--sidebar-border))",
          ring:               "hsl(var(--sidebar-ring))",
        },
        // Rank tier utilities — text-tier-gold, bg-tier-diamond, etc.
        tier: Object.fromEntries(
          Object.entries(tierColorValues).map(([key]) => [
            key.toLowerCase(),
            `hsl(var(--tier-${key.toLowerCase()}))`,
          ])
        ),
        // Status utilities — text-status-online, bg-status-offline, etc.
        status: Object.fromEntries(
          Object.keys(statusColorValues).map((key) => [
            key,
            `hsl(var(--status-${key}))`,
          ])
        ),
      },

      // ─── Border Radius ───────────────────────────────────────────────────
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },

      // ─── Z-Index ─────────────────────────────────────────────────────────
      zIndex: Object.fromEntries(
        Object.entries(zIndex).map(([k, v]) => [k, String(v)])
      ),

      // ─── Animations ──────────────────────────────────────────────────────
      keyframes,
      animation: tailwindAnimation,
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
