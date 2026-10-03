# Icons

The icon set. One module per icon, imported by name:

```tsx
import AddFilled from "uireload/icons/AddFilled";
import AddOutlined from "uireload/icons/AddOutlined";

<AddFilled size="sm" title="Add item" />
```

The per-icon specifier is the API. It is not a barrel, and that is the point: an app that
uses three glyphs ships three glyphs.

## Naming

Every icon is `PascalCase` with no separators, because the module name **is** the
identifier a consumer writes at the call site. `AddFilled`, never `add-filled` or `Add`.

| Suffix        | Meaning                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `Filled`      | The solid form.                                                                                    |
| `Outlined`    | The line form, a 1.75 stroke with round caps and joins.                                            |
| _(none)_      | The icon has only one honest form, so it carries no postfix at all.                                 |

A base name is always either `Filled` **and** `Outlined`, or bare. A lone `Filled` with no
`Outlined` sibling is not a thing: it reads as an unfinished pair, and nothing downstream
can tell it apart from a decision. `tests/package-structure.test.ts` enforces both halves.

Twenty-seven icons ship once, because a glyph with no solid form is not made better by
inventing one: `At`, `BatteryLow`, `BatteryFull`, `BatteryCharging`, `Bluetooth`,
`BlurOn`, `BlurOff`, `Moon`, `Sun`, `CalendarToday`, `ChevronDown`, `ChevronUp`,
`ChevronLeft`, `ChevronRight`, `DragHandle`, `Undo`, `Redo`, `Select`, `Loader`, `Play`,
`Pause`, `Stop`, `Mic`, `ZoomIn`, `ZoomOut`, `Power`, `Wifi`.

## What the two variants mean

Not "same shape, different weight" everywhere, because that is not what a filled form
usually is:

- **Solid geometry.** A disc, a plate, a silhouette. `Filled` fills the shape and knocks
  holes out of it with `fill-rule: "evenodd"`; `Outlined` strokes the same outline.
  `ClockFilled` is a filled clock face with the hands cut out of it.
- **Heavy stroke.** A mark rather than a shape — a paperclip, an arrow, a Bluetooth
  rune, a `</>`. There is no solid form of those that is better than the mark itself, so
  `Filled` is the same construction at 2.6 units instead of 1.75. `CloseFilled` is a
  chunky cross; `CloseOutlined` is a hairline one.

One weight per family, everywhere, because an outline that is 2 in one icon and 1.5 in the
next does not read as two weights. It reads as two sets.

## Props

| Prop       | Type                        | Default  | Notes                                                                       |
| ---------- | --------------------------- | -------- | --------------------------------------------------------------------------- |
| `size`     | `sm \| md \| lg \| string` | `1em`    | The three names map to `--uir-icon-size-*`; any other string is a CSS length. |
| `title`    | `string`                    | _(none)_ | Accessible name. Omit it and the icon is decorative.                        |
| `className`| `string`                    | _(none)_ | Merged onto `uir-icon`.                                                     |
| `style`    | `CSSProperties`             | _(none)_ | Applied to the `<svg>`. Merged after `size`, so it wins.                    |
| `ref`      | `Ref<SVGSVGElement>`        | _(none)_ | Forwarded to the `<svg>`.                                                   |

Every other `<svg>` attribute is forwarded, so `fill`, `strokeWidth`, `aria-label` and
`role` all work without a wrapper.

### Size

`size` is `em` by default and that default is the feature. An icon beside text is the size
of that text without anyone saying so, at every step in the type scale — which is the most
common way an icon set looks wrong. The three token names exist for the case where the
icon sits in a control and must match its height, and they resolve in CSS so a consumer
can restyle them.

```tsx
<AddFilled />                    {/* 1em — matches the surrounding text      */}
<AddFilled size="sm" />          {/* --uir-icon-size-sm                      */}
<AddFilled size="2.5rem" />      {/* any CSS length, applied directly        */}
```

### Accessibility

An icon is **decorative by default**: `aria-hidden="true"`, no role, and no `<title>`. That
is the correct default because an icon beside a visible label carries nothing the label
does not already carry, and announcing "image, settings" immediately before the word
"Settings" is noise.

Supply `title` to turn it into a named image — `role="img"` plus a `<title>` — which is
what an icon needs when it is the *only* content of a control:

```tsx
<IconButton aria-label="Add item">
  <AddFilled />
</IconButton>

<IconButton>
  <AddFilled title="Add item" />
</IconButton>
```

Either is fine; `aria-label` on the control is usually simpler, and `title` is what to
reach for when the icon is the only thing that can say it. The two halves are set together
and cannot be set independently on purpose: `role="img"` with no name is announced as an
unlabelled image, which is worse than either alternative.

## CSS

`.uir-icon` is in the base layer of `uireload/styles.css`:

| Selector                 | Declares                                                       |
| ------------------------ | -------------------------------------------------------------- |
| `.uir-icon`              | `1em` square, `inline-block`, not shrinkable, baseline-nudged.  |
| `.uir-icon[data-size=…]` | `inline-size` / `block-size` from `--uir-icon-size-{sm,md,lg}`. |

There is deliberately no `fill` rule. Outlined icons carry `fill="none"` as an attribute,
and a declaration in the base layer would beat that attribute and give every outlined icon
a filled background.

```css
/* A 20px icon in a dense table row, whatever the tokens say. */
.uir-table .uir-icon {
  inline-size: 1.25rem;
  block-size: 1.25rem;
}
```

## The grid

Every glyph is drawn on `viewBox="0 0 24 24"`, with about two units of optical padding, and
paints with `currentColor` and nothing else. The grid is what makes 285 separate files
look like one set, and `src/icons/icons.test.tsx` asserts it for all of them — including
that each glyph's geometry stays inside its own viewport, which is the failure that shows
up as a glyph clipped at the corner.

Path data is written in `M`, `L`, `H`, `V`, `A` and `Z`, and nothing else. That is not
asceticism: `src/icons/icons.test.tsx` bounds-checks every glyph by parsing its own path
data, because jsdom has no `getBBox`, and a parser that only has to understand six
commands is a parser that can be read. A cubic curve would be checked by different code
from the one that drew it.

There is no raster anywhere in the set, no font glyph, and no external reference, so an
icon is infinitely scalable and costs a few hundred bytes.

## Adding one

1. Add `src/icons/<Name>.<Filled|Outlined>.tsx`. One call to one of the two factories in
   `_create-icon.tsx` — `filledIcon`, `outlinedIcon`, or `heavyIcon` for a mark with no
   solid form:

   ```tsx
   import { filledIcon } from "./_create-icon";

   export default filledIcon("ExampleFilled", <path d="…" />);
   ```

2. Run `npm run sync:exports`. The icon needs no `typesVersions` line by hand, but the
   manifest is generated and `--check` fails without it.
3. Run `npm run verify`.

**Do not add a glyph that already ships under another name.** The set has no aliases: a
`Settings` that is `Build` again, or a `Success` that is `Approve` again, is a second
answer to a question that already has one, and the consumer ends up with two imports that
mean the same thing. When a name is wanted and a near-equivalent exists, the gap is closed
by documenting the existing name instead. `Expand` and `Collapse` were drawn twice and
discarded twice for exactly this reason — the four-arrow form is `FullScreen`, and the
box-and-arrow form is illegible at 20px.

The `_`-prefixed modules beside them — `_create-icon.tsx` and `_set.ts` — are private: the
build skips them and they are not publishable. `_set.ts` is the catalogue the Storybook
gallery renders, generated rather than hand-maintained so it cannot drift from what ships.