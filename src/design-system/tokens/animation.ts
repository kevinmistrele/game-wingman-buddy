/**
 * Animation Tokens
 *
 * Duration and easing values shared between Tailwind keyframes and Framer Motion.
 * Import `motionConfig` in components that use Framer Motion to keep
 * animation timing consistent across the product.
 */

// ─── Duration ────────────────────────────────────────────────────────────────

export const duration = {
  instant:  0,
  fast:     150,   // ms — micro-interactions (hover, focus)
  normal:   250,   // ms — standard transitions
  moderate: 400,   // ms — page-level entrances
  slow:     600,   // ms — hero animations
  crawl:    800,   // ms — onboarding / splash
} as const

// CSS string versions for Tailwind / CSS-in-JS
export const durationCss = {
  fast:     '150ms',
  normal:   '250ms',
  moderate: '400ms',
  slow:     '600ms',
  crawl:    '800ms',
} as const

// ─── Easing ──────────────────────────────────────────────────────────────────

export const easing = {
  linear:    'linear',
  ease:      'ease',
  easeIn:    'ease-in',
  easeOut:   'ease-out',
  easeInOut: 'ease-in-out',
  spring:    'cubic-bezier(0.34, 1.56, 0.64, 1)',   // bouncy
  snappy:    'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // smooth decel
} as const

// ─── Framer Motion Presets ───────────────────────────────────────────────────
// Ready-to-spread transition objects for consistent motion across components.

export const motionConfig = {
  fadeUp: {
    initial:    { opacity: 0, y: 20 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: duration.slow / 1000, ease: easing.snappy },
  },
  fadeIn: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    transition: { duration: duration.moderate / 1000 },
  },
  scaleIn: {
    initial:    { opacity: 0, scale: 0.95 },
    animate:    { opacity: 1, scale: 1 },
    transition: { duration: duration.moderate / 1000, ease: easing.spring },
  },
  slideUp: {
    initial:    { y: 20, opacity: 0 },
    animate:    { y: 0, opacity: 1 },
    exit:       { y: -20, opacity: 0 },
    transition: { duration: duration.normal / 1000 },
  },
  hoverLift: {
    whileHover: { y: -6, transition: { duration: duration.normal / 1000 } },
  },
  hoverScale: {
    whileHover: { scale: 1.03, transition: { duration: duration.normal / 1000 } },
  },
  tapPress: {
    whileTap: { scale: 0.95 },
  },
  pulse: {
    animate:    { opacity: [0.85, 1, 0.85] },
    transition: { duration: 3, repeat: Infinity },
  },
} as const

// ─── Tailwind Keyframes ──────────────────────────────────────────────────────

export const keyframes = {
  'accordion-down': {
    from: { height: '0' },
    to:   { height: 'var(--radix-accordion-content-height)' },
  },
  'accordion-up': {
    from: { height: 'var(--radix-accordion-content-height)' },
    to:   { height: '0' },
  },
  'pulse-glow': {
    '0%, 100%': { opacity: '0.4' },
    '50%':      { opacity: '1' },
  },
  'scan-line': {
    '0%':   { transform: 'translateY(-100%)' },
    '100%': { transform: 'translateY(100%)' },
  },
  'float-up': {
    '0%':   { transform: 'translateY(100vh)', opacity: '0' },
    '10%':  { opacity: '0.6' },
    '90%':  { opacity: '0.6' },
    '100%': { transform: 'translateY(-10vh)', opacity: '0' },
  },
} as const

export const tailwindAnimation = {
  'accordion-down': `accordion-down ${durationCss.normal} ease-out`,
  'accordion-up':   `accordion-up ${durationCss.normal} ease-out`,
  'pulse-glow':     'pulse-glow 2s ease-in-out infinite',
  'scan-line':      'scan-line 3s linear infinite',
  'float-up':       'float-up 8s linear infinite',
} as const
