/**
 * Spacing & Layout Tokens
 *
 * Z-index scale, container widths and breakpoints.
 * Import zIndex in components that set z-index inline (e.g. modals, tooltips).
 */

// ─── Z-Index Scale ───────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  raised:  10,
  dropdown:20,
  sticky:  30,
  overlay: 40,
  modal:   50,
  toast:   60,
  tooltip: 70,
} as const

export type ZIndexKey = keyof typeof zIndex

// ─── Container ───────────────────────────────────────────────────────────────

export const container = {
  padding: '2rem',
  maxWidth: '1400px',
} as const

// ─── Breakpoints ─────────────────────────────────────────────────────────────

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1400px',
} as const
