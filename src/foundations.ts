/**
 * Shared foundations.
 *
 * Every interactive component styles from the same control tokens and the same
 * `variant` / `tone` ladder. That is what makes components consistent by
 * construction rather than by review: a new component has no decisions left to make
 * about its own size, emphasis or state colours.
 *
 * The rationale, the dimensions, and the state machine are documented in
 * `docs/foundations.md`. This module is the machine-readable half of that contract.
 */

import type { Size } from "./types";

export type { Size };

/**
 * Emphasis ladder, weakest to strongest.
 *
 * `ghost` / `outline` / `solid` describe what the component *looks like*, which is the
 * only thing a variant controls here. Intent is the separate `tone` axis, so a component
 * never has to invent a `variant="danger"` that quietly means "both louder and
 * destructive".
 *
 * `outline` is the default rather than `ghost` because a control with no border is
 * ambiguous against an arbitrary background, and ambiguity is the wrong default for
 * something a user has to identify before clicking.
 */
export const VARIANTS = ["ghost", "outline", "solid"] as const;
export type Variant = (typeof VARIANTS)[number];

/**
 * Intent. Independent of emphasis, so all four tones exist at every variant.
 *
 * Every tone pairs with every variant, so a new component gets all twelve combinations
 * from two declarations rather than from an enumerated list that has to be kept in step.
 *
 * Only these four exist. `info` and `warning` are deliberately absent: a tone has to
 * carry meaning that changes what the user should *do*, and there is no fourth such
 * meaning here. `accent` is the "look at me" tone, `positive` the "this worked" tone and
 * `danger` the "this will cost you" tone. See `docs/foundations.md`.
 */
export const TONES = ["neutral", "accent", "positive", "danger"] as const;
export type Tone = (typeof TONES)[number];

/**
 * Sizes, shared by every control.
 *
 * Three tiers, named `sm | md | lg` because `Size` was fixed before any component
 * existed.
 *
 * | Size | Height   | Min width | Font size | Use                                    |
 * | ---- | -------- | --------- | --------- | -------------------------------------- |
 * | `sm` | `1.5rem` | `2.25rem` | `0.875rem` | Dense toolbars, table row actions      |
 * | `md` | `2.25rem`| `3rem`    | `1rem`     | Default. Everything else.              |
 * | `lg` | `2.75rem`| `3.75rem` | `1.125rem` | Marketing surfaces, touch-first apps  |
 *
 * `sm` is 24px because that is the floor, not because it is comfortable: it is the
 * smallest a target may be and still satisfy WCAG 2.2 SC 2.5.8. Density is expressed as
 * less horizontal space at the same height, never as a shorter control, so no size tier
 * can produce an unreachable target.
 *
 * All three clear WCAG 2.2 SC 2.5.8 Target Size (Minimum), 24x24 CSS px.
 */
export const SIZES = ["sm", "md", "lg"] as const;

/**
 * Interactive states every control must implement.
 *
 * Documented as a list rather than as a CSS-only concept because each one has a
 * behavioural requirement as well as a visual one.
 */
export const CONTROL_STATES = [
  /** Resting appearance. */
  "rest",
  /** Pointer hover. Must not apply on touch-only devices. */
  "hover",
  /** Pointer or keyboard press. */
  "active",
  /** Keyboard focus only. `:focus-visible`, never `:focus`. */
  "focus-visible",
  /** Not actionable. Must leave the element hoverable so tooltips still work. */
  "disabled",
  /** Action in progress. Interaction is blocked. */
  "loading",
] as const;
export type ControlState = (typeof CONTROL_STATES)[number];

/**
 * Control token names.
 *
 * Exported so components, tests and consumer tooling reference the same strings
 * instead of duplicating literals. These resolve in `src/theme/tokens.css`.
 */
export const CONTROL_TOKENS = {
  /* Height and minimum width, per size. */
  heightSm: "--uir-control-height-sm",
  heightMd: "--uir-control-height-md",
  heightLg: "--uir-control-height-lg",
  minWidth: "--uir-control-min-width",

  /* Inline padding, per size. */
  padInlineSm: "--uir-control-pad-inline-sm",
  padInlineMd: "--uir-control-pad-inline-md",
  padInlineLg: "--uir-control-pad-inline-lg",

  /* Block padding, per size. Used by controls shorter than their content. */
  padBlockSm: "--uir-control-pad-block-sm",
  padBlockMd: "--uir-control-pad-block-md",
  padBlockLg: "--uir-control-pad-block-lg",

  /* Shared shape. */
  radius: "--uir-control-radius",
  borderWidth: "--uir-control-border-width",
  gap: "--uir-control-gap",

  /* Typography, per size. */
  fontSizeSm: "--uir-control-font-size-sm",
  fontSizeMd: "--uir-control-font-size-md",
  fontSizeLg: "--uir-control-font-size-lg",
  fontWeight: "--uir-control-font-weight",

  /* Icon sizing, per size. */
  iconSizeSm: "--uir-icon-size-sm",
  iconSizeMd: "--uir-icon-size-md",
  iconSizeLg: "--uir-icon-size-lg",

  /* States. */
  disabledOpacity: "--uir-disabled-opacity",
  focusRingWidth: "--uir-focus-ring-width",
  focusRingOffset: "--uir-focus-ring-offset",
  focusRingColor: "--uir-focus-ring-color",
} as const satisfies Record<string, `--${string}`>;

/** Token name for a size-specific control property. */
export function controlToken(
  group: "height" | "padInline" | "padBlock" | "fontSize" | "iconSize",
  size: Size
): string {
  const suffix = size === "sm" ? "Sm" : size === "lg" ? "Lg" : "Md";
  return CONTROL_TOKENS[`${group}${suffix}` as keyof typeof CONTROL_TOKENS];
}

/** Whether `value` is a valid emphasis variant. Used by prop parsing and tests. */
export function isVariant(value: unknown): value is Variant {
  return typeof value === "string" && (VARIANTS as readonly string[]).includes(value);
}

/** Whether `value` is a valid tone. */
export function isTone(value: unknown): value is Tone {
  return typeof value === "string" && (TONES as readonly string[]).includes(value);
}

/** Whether `value` is a valid size. */
export function isSize(value: unknown): value is Size {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}
