# Right-to-left support

RTL is a build-time property of the CSS, not a runtime toggle. If the library's
stylesheets contain no physical directions, `dir="rtl"` works with no extra
code.

## Using a library component in an RTL page

Nothing to do. `dir` inherits from the document, and library CSS uses logical
properties:

```html
<html dir="rtl">
  <!-- every UIReload component inside is RTL -->
</html>
```

```tsx
<div dir="rtl">
  <Example />
</div>
```

## Writing component CSS

Use logical properties. This is the whole rule.

| Instead of               | Use                         |
| ------------------------ | --------------------------- |
| `margin-left`            | `margin-inline-start`       |
| `margin-right`           | `margin-inline-end`         |
| `padding-left`           | `padding-inline-start`      |
| `border-left`            | `border-inline-start`       |
| `left: 0`                | `inset-inline-start: 0`     |
| `right: 0`               | `inset-inline-end: 0`       |
| `border-top-left-radius` | `border-start-start-radius` |
| `text-align: left`       | `text-align: start`         |
| `float: left`            | `float: inline-start`       |

`npm run lint:css` fails the build on any of these.

```bash
npm run lint:css
```

An intentional exception is marked inline with `uir-logical-disable` and a comment
explaining why.

## The `box-shadow` caveat

A shadow with a negative x-offset means "cast to the left", which mirrors in RTL
and produces a shadow on the wrong side. The lint flags this pattern.

Prefer a symmetric shadow, or an explicit per-direction override:

```css
.uir-example {
  box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
}

[dir="rtl"] .uir-example {
  box-shadow: 0 1px 2px rgb(0 0 0 / 20%); /* symmetric, nothing to mirror */
}
```

## Icons that imply direction

Icons for "next", "back", "send" and "undo" need mirroring, and CSS cannot do it.
Mark them with a logical attribute so consumers decide:

```css
/* A component that renders a directional icon */
.uir-carousel__next-icon {
  scale: -1 1;
}

:dir(rtl) .uir-carousel__next-icon {
  scale: 1 1;
}
```

`:dir()` is preferred over `[dir="rtl"]` because it respects inheritance and does
not leak out of nested direction changes.

## Reading direction in JavaScript

`useDirection` reads from the DOM, never from context:

```tsx
import { useDirection } from "uireload"; // internal; use within a component

const direction = useDirection(rootRef); // "ltr" | "rtl"
const isRtl = direction === "rtl";
```

Three properties this buys:

1. **Portals work.** A dialog rendered into `document.body` resolves direction from
   the document, which may differ from the React subtree it was declared in.
2. **No context, so no disagreement.** A React-tree direction and a DOM direction
   can only ever agree by luck with a context-based implementation.
3. **SSR safe.** The hook returns a default on the first render and syncs in an
   effect, so server and client markup match.

```tsx
function Component() {
  const root = useRef<HTMLDivElement>(null);
  const direction = useDirection(root);
  const onKeyDown = (event: KeyboardEvent) => {
    const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    // ...
  };
  return <div ref={root} onKeyDown={onKeyDown} />;
}
```

### Known limitation

`useDirection` observes the nearest existing `[dir]` ancestor (falling back to
`<html>`). Adding `dir` to an ancestor that previously had none is not observed,
because an ancestor we cannot see cannot be watched.

This is fine in practice: `dir` is set on `<html>` or on an element that already
carries it, which is what real applications do.

## Testing RTL

```tsx
import { renderWithProviders } from "uireload-test";

renderWithProviders(<Example />, { dir: "rtl" });
```

`dir` is applied to a real DOM node, not mocked in JavaScript. A mocked direction
would let a component pass RTL tests while still being broken for real RTL pages.

Every component's test suite must include at least one RTL case.

## In Storybook

Use the direction toolbar. Every story renders inside a real `dir` wrapper, so
switching is an honest test rather than a snapshot comparison.

## Why a lint rule and not a review checklist

Physical CSS looks correct in an LTR test and only breaks once someone runs the app
in Arabic. Storybook cannot catch that in CI, and review reliably misses it. A lint
rule is the only enforcement that actually holds over time.
