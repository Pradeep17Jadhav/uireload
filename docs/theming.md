# Theming

UIReload ships **tokens**, not a theme. There is no provider to mount and nothing
to hydrate.

```bash
npm install uireload
```

```ts
import "uireload/styles.css";
```

## How it works

Design tokens are CSS custom properties declared on `:root` in
`src/theme/tokens.css`. They inherit, so you override them at any scope:

```css
/* Application-wide */
:root {
  --uir-accent: #0b6;
  --uir-radius: 2px;
}

/* A subtree only */
[data-theme="brandy"] {
  --uir-accent: #7c3aed;
}

/* One instance, inline */
<div style={{ "--uir-radius": "0" } as React.CSSProperties} />
```

Because custom properties inherit and cascade, scoping a theme is ordinary CSS.
No context, no provider ordering, no extra render when the theme changes.

## Why there is no provider

The full argument is in [`docs/architecture.md`](../docs/architecture.md). The
short version: a provider that reads `prefers-color-scheme` or `localStorage` must
either render nothing on the server (flash of unstyled content) or guess
(hydration mismatch), and it costs a React render for every consumer on every theme
change. CSS resolves both problems after hydration, with no JavaScript at all.

## Color schemes

Three schemes ship by default, selected with `data-uir-scheme` on any ancestor:

| Value           | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| `light`         | Default.                                                           |
| `dark`          | WCAG AA contrast against the dark palette.                         |
| `high-contrast` | WCAG 1.4.6 / 1.4.11. Borders become explicit; focus rings thicken. |

```html
<div data-uir-scheme="dark">
  <!-- anything inside is dark -->
</div>
```

Auto dark mode only applies when no scheme is pinned:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-uir-scheme]) {
    --uir-background: #0b1120;
    /* ... */
  }
}
```

## Where the scheme attribute goes

**Put it on `<html>` or `<body>`.** Not on an arbitrary ancestor.

```html
<html data-uir-scheme="dark"></html>
```

This is not a style preference; it follows from the rule above. Auto dark mode is
declared on `:root:not([data-uir-scheme])`, which means it is decided at the document
root. A `data-uir-scheme` set deeper in the tree arrives _after_ those values have
already been inherited, and cannot undo them.

The consequence, stated precisely:

| Pin                               | Works on a subtree? | Why                                                                                                 |
| --------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `data-uir-scheme="dark"`          | Yes                 | It only adds overrides.                                                                             |
| `data-uir-scheme="high-contrast"` | Yes                 | Same.                                                                                               |
| `data-uir-scheme="light"`         | **No**              | Light is the base palette; a pin on a descendant cannot beat values already inherited from `:root`. |

So a page that pins `light` must pin it on `<html>`, otherwise a user whose OS
prefers dark sees a dark page. `:root:not([data-uir-scheme])` has specificity
0,2,0, which is why a 0,1,0 `[data-uir-scheme="light"]` rule loses to it.

`[data-uir-scheme="light"]` _is_ declared alongside `:root` so the pin is meaningful
wherever it can be — see `tests/theme-tokens.test.ts`, which asserts both facts.

If you need genuinely per-subtree light and dark simultaneously, set the tokens
directly in a scoped rule. Plain CSS cannot express it, and a design system that
pretends otherwise is worse than one that says so.

## Density

`data-uir-density="compact" | "comfortable"` scales the spacing scale and base font
size. Components scale from scale steps rather than a single multiplier, so density
changes do not distort component-internal rhythm.

## Tokens

Full list with default values: [`src/theme/tokens.css`](../src/theme/tokens.css).
The typed contract, exported as `TOKENS`, is in
[`src/theme/tokens.ts`](../src/theme/tokens.ts).

| Group       | Examples                                                               |
| ----------- | ---------------------------------------------------------------------- |
| Color       | `--uir-accent`, `--uir-surface`, `--uir-border`, `--uir-text-muted`    |
| Typography  | `--uir-font-family`, `--uir-font-size`, `--uir-line-height`            |
| Space/shape | `--uir-space`, `--uir-radius`, `--uir-border-width`, `--uir-shadow`    |
| Motion      | `--uir-duration`, `--uir-easing`                                       |
| Layers      | `--uir-z-index-overlay`                                                |
| Focus       | `--uir-focus-ring-width`, `--uir-outline-color`, `--uir-outline-width` |

**Renaming or removing a token is a breaking change.** A test asserts that every
token in `TOKENS` is defined in `tokens.css`.

## Motion and reduced motion

Tokens collapse to near-zero under `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --uir-duration: 0.01ms;
  }
}
```

Opt back in per subtree by overriding `--uir-duration`.

## Forced colors

Under `forced-colors: active`, decorative colors are replaced with system colors
so Windows High Contrast Mode renders correctly.

## Layer order

Declared explicitly so consumers can participate in the cascade:

```css
@layer uireload.tokens, uireload.base, uireload.utilities, uireload.components;
```

Add your own layer after `uireload.components` and your rules win without
specificity games or `!important`.

## Best practices

- **Re-declare tokens, never fight selectors.** If you need to override something a
  token does not cover, that is a gap in the token contract. Add a token rather than
  reaching for `!important`.
- **Do not set `!important` on library classes.** It is there so you do not have to.
- **Use `data-*` state attributes.** Components style state from `data-state`,
  `data-size`, `data-disabled`, so you can target them without knowing our class
  names.
- **Use logical properties.** The library lint fails on `margin-left` and
  `text-align: right` so RTL works without a second stylesheet. Do the same in your
  overrides.
