/**
 * Color Tokens
 *
 * Theme-aware semantic colors reference CSS custom properties (set in index.css).
 * Static colors (tier, status, game) are defined here as raw HSL strings and
 * also exported as CSS variable names so index.css can consume them without duplication.
 */

// ─── Semantic Token References ──────────────────────────────────────────────
// These reference CSS custom properties that are set per-theme in index.css.
// Use in Tailwind config via hsl(var(--x)) or directly in inline styles.

export const semanticColorVars = {
  background:         '--background',
  foreground:         '--foreground',
  card:               '--card',
  cardForeground:     '--card-foreground',
  popover:            '--popover',
  popoverForeground:  '--popover-foreground',
  primary:            '--primary',
  primaryForeground:  '--primary-foreground',
  secondary:          '--secondary',
  secondaryForeground:'--secondary-foreground',
  muted:              '--muted',
  mutedForeground:    '--muted-foreground',
  accent:             '--accent',
  accentForeground:   '--accent-foreground',
  destructive:        '--destructive',
  destructiveForeground: '--destructive-foreground',
  border:             '--border',
  input:              '--input',
  ring:               '--ring',
} as const

// ─── Raw Theme Palette ───────────────────────────────────────────────────────
// HSL strings (without hsl()) used to populate CSS vars in index.css.
// These are the source of truth — never write these values elsewhere.

export const palette = {
  dark: {
    background:         '220 20% 7%',
    foreground:         '200 20% 92%',
    card:               '220 18% 10%',
    cardForeground:     '200 20% 92%',
    popover:            '220 18% 10%',
    popoverForeground:  '200 20% 92%',
    primary:            '175 85% 50%',
    primaryForeground:  '220 20% 7%',
    secondary:          '35 95% 55%',
    secondaryForeground:'220 20% 7%',
    muted:              '220 15% 15%',
    mutedForeground:    '220 10% 55%',
    accent:             '260 70% 60%',
    accentForeground:   '200 20% 95%',
    destructive:        '0 72% 55%',
    destructiveForeground: '210 40% 98%',
    border:             '220 15% 18%',
    input:              '220 15% 18%',
    ring:               '175 85% 50%',
    sidebarBackground:  '220 20% 8%',
    sidebarForeground:  '200 20% 85%',
    sidebarPrimary:     '175 85% 50%',
    sidebarPrimaryForeground: '220 20% 7%',
    sidebarAccent:      '220 15% 14%',
    sidebarAccentForeground: '200 20% 92%',
    sidebarBorder:      '220 15% 16%',
    sidebarRing:        '175 85% 50%',
  },
  light: {
    background:         '210 20% 96%',
    foreground:         '220 20% 15%',
    card:               '0 0% 100%',
    cardForeground:     '220 20% 15%',
    popover:            '0 0% 100%',
    popoverForeground:  '220 20% 15%',
    primary:            '175 85% 38%',
    primaryForeground:  '0 0% 100%',
    secondary:          '35 95% 48%',
    secondaryForeground:'0 0% 100%',
    muted:              '210 15% 90%',
    mutedForeground:    '220 10% 45%',
    accent:             '260 60% 55%',
    accentForeground:   '0 0% 100%',
    destructive:        '0 72% 50%',
    destructiveForeground: '0 0% 100%',
    border:             '210 15% 85%',
    input:              '210 15% 85%',
    ring:               '175 85% 38%',
    sidebarBackground:  '210 15% 94%',
    sidebarForeground:  '220 15% 30%',
    sidebarPrimary:     '175 85% 38%',
    sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent:      '210 15% 88%',
    sidebarAccentForeground: '220 20% 15%',
    sidebarBorder:      '210 15% 85%',
    sidebarRing:        '175 85% 38%',
  },
} as const

// ─── Rank / Tier Colors ──────────────────────────────────────────────────────
// Static — do not change with theme. Used as CSS vars (--tier-*) and
// Tailwind utilities (text-tier-*, bg-tier-*).

export const tierColorValues = {
  IRON:        '220 10% 55%',
  BRONZE:      '25 60% 50%',
  SILVER:      '220 10% 65%',
  GOLD:        '35 95% 55%',
  PLATINUM:    '175 60% 50%',
  EMERALD:     '140 60% 50%',
  DIAMOND:     '210 80% 65%',
  MASTER:      '260 70% 60%',
  GRANDMASTER: '0 72% 55%',
  CHALLENGER:  '45 100% 60%',
} as const

export type TierColorKey = keyof typeof tierColorValues

// ─── Feedback / Semantic State Colors ───────────────────────────────────────
// Used for performance indicators (KDA, win rate) and icon accents.
// Reference CSS vars --warning and --info (theme-aware).

export const feedbackColorVars = {
  warning: '--warning',
  info:    '--info',
} as const

// ─── Status Colors ───────────────────────────────────────────────────────────

export const statusColorValues = {
  online:  '142 71% 45%',
  offline: '220 10% 40%',
  away:    '35 95% 55%',
  busy:    '0 72% 55%',
} as const
