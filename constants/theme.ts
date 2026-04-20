/**
 * ALON — Design System tokens
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  CANVAS RULE (source of truth — do not drift)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  "ALON goes dark only when the user is being done FOR, not when
 *   they are doing."
 *
 *  • Dark canvas (navy800 / voiceBg): used for passive / ambient moments
 *    where ALON is performing on the user's behalf and the user is meant
 *    to watch, listen, or hand off trust. Examples:
 *      – Splash / brand moment
 *      – Voice brief capture (voiceBg = #0d1117)
 *      – Ambient "activation" transitions that frame ALON as an agent
 *
 *  • Light canvas (background / surface): used whenever the user is
 *    actively making decisions, scanning results, or driving progress.
 *    This is the default — and every "active" stage (Search, Shortlist,
 *    Compare, Negotiate, Finance, Legal, Deal Closure, Dashboard) MUST
 *    live on a light canvas.
 *
 *  If a screen is unsure, default to LIGHT. Dark canvases are the
 *  exception, not the norm. See `Canvas` export below for the authoritative
 *  per-screen map.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  NAVY SCALE (per ALON-Design-System.pdf)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  navy800 (#0D1F4A) — splash & brand moments; also `textPrimary` ink on
 *  light canvas. voiceBg (#0d1117) — voice-only dark. All other navy shades
 *  are derivatives (hovers, pressed states); do not invent new navy shades.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DARK-CANVAS TOKENS (elevation, text, hairlines)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Shadows don't read on dark backgrounds, so dark canvases express
 *  depth through TINTED OVERLAYS and HAIRLINE BORDERS — not `Shadows.*`.
 *  Use the `surfaceOnDark/*`, `textOnDark/*`, `borderOnDark`, and
 *  `overlayOnDark` tokens below instead of ad-hoc `rgba(255,255,255,0.x)`
 *  literals. Drift here is why dark screens looked inconsistent.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  WHAT NOT TO DO
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  • Don't use `navy700`, `navy600`, `navy500` as a screen background —
 *    those are reserved for elevation/hover states if ever needed. Screens
 *    pick `navy800` or go light. Shades in between are visual noise.
 *  • Don't hardcode `rgba(255,255,255,0.08)` etc. — use the `*OnDark`
 *    tokens so the ladder stays consistent across screens.
 *  • Don't mix light + dark on the same screen (e.g. dark hero, light
 *    body). The canvas is a whole-screen decision.
 */

export const Colors = {
  // Trust Architecture — Primary palette
  // Prussian navy: institutional trust, depth
  navy900: '#060F24',
  navy800: '#0D1F4A', // splash / brand moments (DS-canonical)
  navy700: '#142E5C', // reserved for hover/pressed states only
  navy600: '#1B3D6E', // reserved for hover/pressed states only
  navy500: '#244D82', // reserved for hover/pressed states only

  // Blue — kept for interactive/selection states
  // NOTE: values originated from early DS; verify against latest PDF if
  // the Blue scale is ever re-audited. Currently stable & shipping.
  blue600: '#2146B8',
  blue500: '#2952D8',
  blue400: '#4A72E8',
  blue300: '#7B9BF2',
  blue200: '#B3C8F9',
  blue100: '#E0EAFF',
  blue50: '#F0F5FF',

  // Terracotta — brand accent, CTAs, identity
  terra600: '#B8451E',
  terra500: '#D95F2B',
  terra400: '#E8774A',
  terra300: '#F0A080',
  terra200: '#F8D0BC',
  terra100: '#FDF0EA',
  terra50: '#FEF7F3',

  // Ember — action highlight
  ember: '#FF8C42',

  // Warm neutrals
  white: '#FFFFFF',
  cream: '#F5F0E8',
  warm50: '#FAF8F4',
  warm100: '#F0EDE6',
  warm200: '#E0D8CC',
  warm300: '#C8BFB0',
  warm400: '#A89E8E',
  warm500: '#7A7264',
  warm600: '#5C554A',
  warm700: '#3D3832',
  warm800: '#2C2A27',

  // Cool grays — kept for functional UI (inputs, disabled states)
  gray50: '#F8F9FC',
  gray100: '#F0F1F5',
  gray200: '#E2E4EB',
  gray300: '#C8CBD6',
  gray400: '#9CA1B3',
  gray500: '#6B7189',

  black: '#000000',

  // Status colors
  green500: '#22C55E',
  green100: '#DCFCE7',
  amber500: '#F59E0B',
  amber100: '#FEF3C7',
  red500: '#EF4444',

  // ───────────────────────────────────────────────────────────────────
  // Semantic — LIGHT CANVAS (default)
  // ───────────────────────────────────────────────────────────────────
  background: '#FFFFFF',  // pure white — scrollable content surfaces
  surface: '#F5F0E8',     // cream — card / elevated-block background
  textPrimary: '#0D1F4A', // navy800 — headings & primary ink
  textSecondary: '#5C554A', // warm600 — body copy
  textTertiary: '#A89E8E',  // warm400 — meta / captions
  border: '#E0D8CC',        // warm200 — hairlines on light

  // ───────────────────────────────────────────────────────────────────
  // Semantic — DARK CANVAS (splash / voice / activation only)
  // ───────────────────────────────────────────────────────────────────
  // Canvas bases
  voiceBg: '#0d1117',       // voice interaction dark — per DS PDF
  activationGlow: '#E8A84C', // warm gold glow for ambient moments

  // Elevation ladder on dark (use these instead of rgba literals).
  // Shadows don't read on dark, so elevation = slightly-lighter tint.
  surfaceOnDark1: 'rgba(255,255,255,0.05)', // quiet surface (chip rest)
  surfaceOnDark2: 'rgba(255,255,255,0.08)', // card / pill background
  surfaceOnDark3: 'rgba(255,255,255,0.12)', // hover / pressed lift

  // Text scale on dark — mirrors the light text scale but inverted.
  textOnDarkPrimary: '#FFFFFF',             // headings & primary copy
  textOnDarkSecondary: 'rgba(255,255,255,0.6)', // body / supporting
  textOnDarkTertiary: 'rgba(255,255,255,0.4)',  // meta / captions
  textOnDarkQuaternary: 'rgba(255,255,255,0.3)', // disabled / placeholder

  // Hairlines & overlays on dark.
  borderOnDark: 'rgba(255,255,255,0.1)',      // default hairline
  borderOnDarkStrong: 'rgba(255,255,255,0.15)', // emphasized hairline
  overlayOnDark: 'rgba(0,0,0,0.3)',           // scrim for modals/imagery
};

/**
 * Canvas — authoritative per-screen light/dark map.
 *
 * Add a screen here the moment it's created, so the canvas decision is
 * explicit and reviewable. Anything not in this list defaults to 'light'.
 *
 * Keep this list short. Every `dark` entry is a deliberate call that ALON
 * is performing for the user at that moment; everything else should be
 * 'light' by default.
 */
export const Canvas = {
  // Brand / passive moments — ALON is performing, user watches.
  // Goal is classified dark because it's the brand-welcome handshake
  // immediately after splash — the user isn't driving yet, they're being
  // introduced. After voice, activation flips to light and stays there.
  splash: 'dark',       // app/index.tsx
  goal: 'dark',         // app/onboarding/goal.tsx — brand welcome (navy800)
  intent: 'dark',       // app/onboarding/intent.tsx — still brand-led (navy800)
  voice: 'dark',        // app/onboarding/voice.tsx (voice capture, voiceBg)
  activation: 'dark',   // app/onboarding/activation.tsx — ALON is scanning,
                        // user watches. Ambient moment, not an active one.

  // Active moments — user is doing. All must be LIGHT.
  dashboard: 'light',
  shortlist: 'light',
  compare: 'light',
  negotiate: 'light',
  finance: 'light',
  legal: 'light',
  dealClosure: 'light',
} as const;

export type CanvasKey = keyof typeof Canvas;

export const Typography = {
  // DM Serif Display
  serifLarge: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 32,
    lineHeight: 40,
  },
  serifMedium: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
    lineHeight: 32,
  },
  serifSmall: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 20,
    lineHeight: 28,
  },

  // DM Sans
  heading1: {
    fontFamily: 'DMSans-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  heading2: {
    fontFamily: 'DMSans-Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  heading3: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  captionMedium: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  smallMedium: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    lineHeight: 20,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadows — LIGHT CANVAS ONLY. They don't read on dark; use the
// surfaceOnDark/* + borderOnDark tokens to express elevation on dark.
export const Shadows = {
  sm: {
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
};
