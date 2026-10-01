/**
 * Design token contract.
 *
 * UIReload ships *tokens*, not a theme. Tokens are CSS custom properties on the
 * `:root` selector with `inherit` semantics, so consumers override them at any
 * scope they choose: `:root`, a `[data-theme]` selector, a class, or inline on a
 * subtree. The library never writes these values itself, and never reads them in
 * JavaScript, so there is no provider to mount and nothing to hydrate.
 *
 * Naming contract:
 * - `--uir-*`       stable public tokens. Changing these is a breaking change.
 * - `--uir-ref-*`   internal references built on top of primitives.
 *
 * Layers are declared with `@layer` so consumer CSS can override without
 * specificity wars.
 */

export const TOKEN_PREFIX = "--uir";

/**
 * The public token contract, documented as a type so a mismatch between the
 * documentation and `tokens.css` is caught in review.
 *
 * This is documentation plus a compile-time checklist; it is not emitted at
 * runtime, because tokens are resolved by CSS.
 */
export interface ThemeTokens {
  /* ---- Color primitives ---------------------------------------------- */
  /** Library accent, used for focus indicators and primary actions. */
  accent: string;
  accentContrast: string;
  /** Neutral scale: background, surface, border, text. */
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textDisabled: string;
  danger: string;
  dangerContrast: string;
  success: string;
  warning: string;

  /* ---- Typography ------------------------------------------------------ */
  fontFamily: string;
  fontFamilyMono: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: string;

  /* ---- Space & shape --------------------------------------------------- */
  space: string;
  radius: string;
  radiusSmall: string;
  radiusLarge: string;
  borderWidth: string;
  shadow: string;
  shadowLarge: string;

  /* ---- Motion ---------------------------------------------------------- */
  /** Duration tokens must respect `prefers-reduced-motion` in consumer CSS. */
  duration: string;
  durationFast: string;
  easing: string;

  /* ---- Layers ---------------------------------------------------------- */
  zIndexOverlay: string;
}

/**
 * Root CSS custom property names, derived from {@link ThemeTokens}.
 *
 * `--uir-accent` and friends. Exported so tooling and tests can assert the
 * contract without duplicating string literals.
 */
export const TOKENS = {
  accent: "--uir-accent",
  accentContrast: "--uir-accent-contrast",
  background: "--uir-background",
  surface: "--uir-surface",
  surfaceRaised: "--uir-surface-raised",
  border: "--uir-border",
  borderStrong: "--uir-border-strong",
  text: "--uir-text",
  textMuted: "--uir-text-muted",
  textDisabled: "--uir-text-disabled",
  danger: "--uir-danger",
  dangerContrast: "--uir-danger-contrast",
  success: "--uir-success",
  warning: "--uir-warning",
  fontFamily: "--uir-font-family",
  fontFamilyMono: "--uir-font-family-mono",
  fontSize: "--uir-font-size",
  lineHeight: "--uir-line-height",
  fontWeight: "--uir-font-weight",
  space: "--uir-space",
  radius: "--uir-radius",
  radiusSmall: "--uir-radius-small",
  radiusLarge: "--uir-radius-large",
  borderWidth: "--uir-border-width",
  shadow: "--uir-shadow",
  shadowLarge: "--uir-shadow-large",
  duration: "--uir-duration",
  durationFast: "--uir-duration-fast",
  easing: "--uir-easing",
  zIndexOverlay: "--uir-z-index-overlay",
} as const satisfies Record<keyof ThemeTokens, `--${string}`>;

/** Named color schemes the library ships defaults for. */
export const COLOR_SCHEMES = ["light", "dark", "high-contrast"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

/**
 * Attribute the library's CSS keys off for the active color scheme.
 *
 * Consumers can also just set `--uir-*` values directly; this attribute is a
 * convenience, not a requirement.
 */
export const SCHEME_ATTRIBUTE = "data-uir-scheme";

/** Attribute used for density presets. */
export const DENSITY_ATTRIBUTE = "data-uir-density";

export const DENSITIES = ["compact", "comfortable"] as const;
export type Density = (typeof DENSITIES)[number];
