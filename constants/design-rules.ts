/*
  ALON Design System Rules
  ========================
  Every screen and component MUST follow these rules.

  1. COLORS
     - Primary: #2952D8 (blue500). All interactive elements.
     - On-blue backgrounds: Use rgba(255,255,255,α) for layering.
       Cards: rgba(255,255,255,0.08–0.12), border rgba(255,255,255,0.18).
       Active: rgba(255,255,255,0.2), border rgba(255,255,255,0.4).
     - On-light backgrounds: Use gray50 (#F8F9FC) for surface, white for cards.
     - Status: green500 for success, amber500 for warning, red500 for error.
     - Text on blue: white (primary), rgba(255,255,255,0.5–0.6) (secondary).
     - Text on light: textPrimary #1A1D2E, textSecondary #6B7189, textTertiary #9CA1B3.

  2. TYPOGRAPHY
     - Serif (DM Serif Display): wordmark, page titles, emotional headlines only.
     - Sans (DM Sans): everything else. Weights: Regular 400, Medium 500, SemiBold 600, Bold 700.
     - Font sizes: 32/28/22/18/16/14/12. Never 10px or smaller in UI (fine print exception: 11px).
     - Line heights: fontSize × 1.4 for body, × 1.5 for captions, × 1.2 for headings.

  3. SPACING
     - Base unit: 4px. Scale: 4, 8, 12, 16, 20, 24, 32, 48.
     - Screen padding: 24px horizontal (Spacing.xxl).
     - Card internal padding: 14–16px (Spacing.lg).
     - Gap between cards/sections: 12–16px.
     - Section title to content: 16px.

  4. BORDER RADIUS
     - Containers/cards: 14–18px (Radius.lg–xl).
     - Chips/pills: 20px (Radius.full used sparingly, prefer 20px).
     - Icon containers: 12px.
     - Buttons: 16px (Radius.lg).
     - App icon shape: 28px rounded square.

  5. SHADOWS
     - On white bg: 0 2px 8px rgba(0,0,0,0.08) for cards.
     - On blue bg: no shadows — use border + bg opacity for depth.
     - Never heavy shadows. Flat > skeuomorphic.

  6. VISUAL HIERARCHY
     - One primary action per screen. Primary = solid fill, secondary = outlined/ghost.
     - Page title → supporting text → interactive content → CTA (top to bottom).
     - Active state: border color change + bg fill change. Never just color alone.
     - Selected chips: filled bg (blue500 on light, rgba white on blue), white text.

  7. AVATAR / ALON EYE
     - Shape: ROUNDED SQUARE (radius ~35% of size). NOT a circle.
     - Body: Frosted glass — translucent with 1.5px border.
     - Eye: Simple white dot (17.5% of container) with blue iris dot (7.5%) centered.
     - Blink: scaleY 0.08. Duration 100ms close, 150ms open. Cycle every 3.5s.
     - Rings: 1px border, expanding scale 0.9→1.1, opacity 0.8→0, 2.5s cycle.

  8. TRANSITIONS
     - Screen: slide from right, 0.45s cubic-bezier(0.4,0,0.2,1).
     - Content entry: fadeUp (opacity 0→1, translateY 10→0), 0.3s, stagger 100ms.
     - Selection: scale 0.98 press, 0.15s. Background + border transition 0.2s.
     - Auto-advance: 300ms delay after selection highlight.

  9. BLUE-BG SCREENS (splash, intent)
     - Background: gradient or solid blue800 (#102365).
     - Cards: frosted glass (rgba white 0.08, border rgba white 0.18).
     - Hover/selected: rgba white 0.2, border rgba white 0.4.
     - Chat bubbles: frosted glass with radius 6/18/18/18 (pointer top-left).
     - Text: white primary, rgba white 0.5 secondary, rgba white 0.3 tertiary.

  10. LIGHT-BG SCREENS (profile, tweak, activation)
      - Background: gray50 (#F8F9FC) or white.
      - Cards: white bg, 1px border gray200, radius xl (20px).
      - Active selections: blue50 bg, blue500 border.
*/

export const DESIGN_RULES_VERSION = '1.0';
