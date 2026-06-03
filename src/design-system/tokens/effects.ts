/**
 * Effects Tokens
 *
 * Glow shadows, gradients and clip-path shapes used throughout the UI.
 * Glow values are split by theme — dark uses stronger glow, light uses softer.
 * CSS vars (--glow-*, --gradient-*) are set in index.css from these values.
 */

// ─── Glow Shadows ────────────────────────────────────────────────────────────

export const glowValues = {
  dark: {
    primary:   '0 0 20px hsl(175 85% 50% / 0.35)',
    secondary: '0 0 20px hsl(35 95% 55% / 0.35)',
    accent:    '0 0 20px hsl(260 70% 60% / 0.35)',
  },
  light: {
    primary:   '0 0 20px hsl(175 85% 38% / 0.20)',
    secondary: '0 0 20px hsl(35 95% 48% / 0.20)',
    accent:    '0 0 20px hsl(260 60% 55% / 0.20)',
  },
} as const

// ─── Gradients ───────────────────────────────────────────────────────────────

export const gradientValues = {
  dark: {
    hero: 'linear-gradient(135deg, hsl(175 85% 50% / 0.15), hsl(260 70% 60% / 0.10))',
    card: 'linear-gradient(180deg, hsl(220 18% 12%), hsl(220 18% 8%))',
  },
  light: {
    hero: 'linear-gradient(135deg, hsl(175 85% 38% / 0.08), hsl(260 60% 55% / 0.05))',
    card: 'linear-gradient(180deg, hsl(0 0% 100%), hsl(210 15% 97%))',
  },
} as const

// ─── Clip Paths ──────────────────────────────────────────────────────────────
// Angled corners — the signature shape of the design system.

export const clipPaths = {
  angle:   'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
  angleSm: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
} as const

// ─── Border Radius ───────────────────────────────────────────────────────────

export const borderRadius = {
  base: '0.5rem',
  md:   'calc(0.5rem - 2px)',
  sm:   'calc(0.5rem - 4px)',
} as const

// ─── Elevation / Box Shadow ──────────────────────────────────────────────────

export const elevation = {
  none: 'none',
  sm:   '0 1px 3px hsl(220 20% 4% / 0.4)',
  md:   '0 4px 12px hsl(220 20% 4% / 0.5)',
  lg:   '0 8px 24px hsl(220 20% 4% / 0.6)',
} as const
