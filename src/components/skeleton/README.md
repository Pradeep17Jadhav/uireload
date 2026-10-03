# Skeleton

A placeholder shaped like what it replaces. The whole design question is what it says out loud.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

## Props

| Prop        | Type                                | Default     | Notes                                        |
| ----------- | ----------------------------------- | ----------- | -------------------------------------------- |
| `variant`   | `"text" \| "rounded" \| "circular"` | `"text"`    |                                              |
| `lines`     | `number`                            | `1`         | `text` only. Clamped to at least 1.          |
| `width`     | `number \| string`                  | —           | A number is pixels. A string passes through. |
| `height`    | `number \| string`                  | —           |                                              |
| `animate`   | `boolean`                           | `true`      |                                              |
| `label`     | `string`                            | `"Loading"` | The region's accessible name.                |
| `className` | `string`                            | —           |                                              |
| `ref`       | `Ref<HTMLDivElement>`               | —           |                                              |

## Nothing is announced, and that is the point

A screen reader reading "grey rectangle" has told the user nothing they did not already know. Reading
it four times is actively worse — it delays the announcement that does matter.

So **every bar is `aria-hidden`**, and a single `role="status"` region carries the meaning. The region
exists from the first render, is named `Loading` (or a `label` you supply), and is `aria-busy="true"`.

`aria-live="polite"` is stated even though `role="status"` implies it. The implicit value is the right
one and stating it costs one attribute; what it buys is that a reader of the file does not have to
know that `status` is polite — and the case that genuinely matters is `assertive`, which nobody would
guess is right here.

## `lines={0}` still renders one bar

Zero lines renders an empty status region that announces nothing and occupies no height — so the
content arrives from nothing, which is the layout shift the component exists to prevent. Clamped to 1.

## Only the last line is shortened

A paragraph's last line is short. Four equal bars read as four separate items rather than one block of
text, and the whole point of a multi-line skeleton is that it looks like one paragraph.

A **single** line is not shortened either, because a lone bar at 60% is a stub and the paragraph it
stands for is a full line.

## Width and height accept a number or a string

`width={240}` becomes `240px` and `width="50%"` passes through. A component that silently ignored one
of the two would be the alternative, and the consumer would not find out until the placeholder was the
wrong shape.

The root fills its container by default from the stylesheet (`inline-size: 100%`), so the common case
needs no prop.

## Reconciled design

| Decision        | Choice                       | Why                                                             |
| --------------- | ---------------------------- | --------------------------------------------------------------- |
| Role            | `status`, `aria-busy`        | A loading state, not content.                                   |
| Live politeness | `polite`                     | A placeholder interrupting a screen reader would be absurd.     |
| Bars            | all `aria-hidden`            | "Grey rectangle" tells the user nothing.                        |
| Name            | `label`, default `"Loading"` | The region must say _what_ is loading, not merely that it is.   |
| `lines={0}`     | clamped to 1                 | Zero lines is the layout shift the component exists to prevent. |
| Shortening      | last line only               | Four equal bars read as four items.                             |
| `animate`       | on by default                | A static placeholder is hard to tell from a broken render.      |
| Shape           | three variants               | A placeholder unlike its content reflows the page.              |

## Keyboard

None. A skeleton is not interactive and has no tab stop. It disappears from the accessibility tree
almost entirely — one named status region and a set of hidden bars.

## CSS contract

```
.uir-skeleton          the root; data-variant, data-lines,
                       data-animate (when animating)
.uir-skeleton__bar     one line of text; aria-hidden
.uir-skeleton__shape   a rounded or circular block; aria-hidden
```

Component-local tokens: `--uir-skeleton-fill`, `--uir-skeleton-radius`.

The animation is a `background-position` sweep on a gradient, not a `transform` on the element. A
transform would move the placeholder's box and defeat the entire purpose — the box has to stay exactly
where the content will land.

`width` and `height` are applied to the root as inline styles, which is why the root is the element
you measure: a skeleton whose box is not the box the content will occupy is not doing its job.

## Accessibility

- One `role="status"` region, named, `aria-busy="true"`, `aria-live="polite"`.
- Every bar and shape `aria-hidden`.
- The shimmer is suppressed under `prefers-reduced-motion`; the placeholder is still there, just still.
- `forced-colors` restates the fill as `Canvas` and the border as `CanvasText`, because a shimmer that
  depends on a gradient the theme does not know renders as an invisible block — which reads as content
  that has finished loading and is empty.

## Gaps

- **A `title`.** Not implemented. There is no hover affordance on a placeholder, so a tooltip would be
  announcing the loading state twice.
- **Deliberate content.** `SkeletonRow` exists in the types for a future composed variant, but no
  `rows` prop is exposed yet — a table skeleton needs to agree with the table's own column widths,
  which is a question about the consumer's layout rather than about this component.
- **A delay before showing.** Common in practice — a skeleton that flashes for 80ms and is replaced
  looks like a flash rather than a load. Deliberately not built in: the threshold is a product
  decision, and a component that guesses it introduces a visible delay for content that is genuinely
  fast.
