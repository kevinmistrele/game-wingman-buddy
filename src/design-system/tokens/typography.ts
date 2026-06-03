/**
 * Typography Tokens
 *
 * Single source of truth for all font-related decisions.
 * Consumed by tailwind.config.ts and directly in components via `font` imports.
 */

// ─── Font Families ───────────────────────────────────────────────────────────

export const fontFamily = {
  display: ['Rajdhani', 'sans-serif'],
  body:    ['Inter', 'sans-serif'],
} as const

export const fontFamilyImportUrl =
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'

// ─── Font Sizes ──────────────────────────────────────────────────────────────
// Tuple: [fontSize, { lineHeight }]
// Minimum rendered size is 14px (xs) to satisfy readability standards.

export const fontSize = {
  xs:   ['0.875rem', { lineHeight: '1.4' }],   // 14px
  sm:   ['1rem',     { lineHeight: '1.5' }],   // 16px
  base: ['1rem',     { lineHeight: '1.5' }],   // 16px
  md:   ['1.125rem', { lineHeight: '1.5' }],   // 18px
  lg:   ['1.5rem',   { lineHeight: '1.3' }],   // 24px
  xl:   ['2rem',     { lineHeight: '1.2' }],   // 32px
  '2xl':['2rem',     { lineHeight: '1.2' }],   // 32px
  '3xl':['2.25rem',  { lineHeight: '1.2' }],   // 36px
  '4xl':['2.75rem',  { lineHeight: '1.1' }],   // 44px
  '5xl':['3.5rem',   { lineHeight: '1.1' }],   // 56px
  '6xl':['4rem',     { lineHeight: '1.05' }],  // 64px
  '7xl':['5rem',     { lineHeight: '1.05' }],  // 80px
} as const

// ─── Font Weights ────────────────────────────────────────────────────────────

export const fontWeight = {
  light:    '300',
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
} as const

// ─── Letter Spacing ──────────────────────────────────────────────────────────
// Display / HUD text uses wide tracking; body text is normal.

export const letterSpacing = {
  tight:   '-0.01em',
  normal:  '0em',
  wide:    '0.02em',
  wider:   '0.08em',
  widest:  '0.2em',
  display: '0.3em',   // Section headers like "COMO FUNCIONA"
} as const

// ─── Line Heights ────────────────────────────────────────────────────────────

export const lineHeight = {
  none:    '1',
  tight:   '1.2',
  snug:    '1.3',
  normal:  '1.5',
  relaxed: '1.625',
} as const
