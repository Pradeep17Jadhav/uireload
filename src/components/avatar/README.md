# Avatar

A face, an initial, or nothing. The whole design question is what happens when the image fails.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

## Props

| Prop          | Type                      | Default      | Notes                               |
| ------------- | ------------------------- | ------------ | ----------------------------------- |
| `src`         | `string`                  | —            |                                     |
| `alt`         | `string`                  | —            | `""` is meaningful. See below.      |
| `initials`    | `string`                  | —            | See `initialsFrom` below.           |
| `variant`     | `"circular" \| "rounded"` | `"circular"` |                                     |
| `size`        | `Size`                    | `"md"`       | Reads the control height ladder.    |
| `tone`        | `Tone`                    | `"neutral"`  | The fill when there is no image.    |
| `interactive` | `boolean`                 | `false`      | Renders a `<button>`.               |
| `badge`       | `ReactNode`               | —            | `aria-hidden`.                      |
| `disabled`    | `boolean`                 | `false`      | Only meaningful with `interactive`. |
| `className`   | `string`                  | —            |                                     |
| `ref`         | `Ref<HTMLElement>`        | —            |                                     |

## An image failing is normal, not exceptional

A revoked gravatar, a moved file, a CDN that expired the URL. None of those is an error condition, and
a broken-image glyph is a worse answer than the initials the component already has.

So a failed load **falls back to the initials**, permanently. There is no error state and no retry
affordance, because there is nothing the user could do about it from here.

## The image and the initials are alternatives, never both

```html
<img alt="Ada Lovelace" />
<!-- announced -->
<span>AL</span>
<!-- not rendered -->
```

Rendering both would announce "Ada Lovelace, AL" — and the letters say nothing the alt does not.

So `alt=""` is not a missing alt, it is the correct declaration that the image carries no information
**because the name is already visible beside it**. That is precisely what the consumer declared by
passing it, so the initials are not rendered either.

## `interactive` changes the element, and that is the point

A `<div>` with a click handler gets none of this for free: no tab stop, no Space or Enter, no focus
ring, no disabled semantics. Writing all four by hand is the usual source of "the avatar button does
not work with a keyboard".

`interactive` renders a real `<button type="button">`. One tab stop, activation is the platform's, and
`type="button"` matters — an avatar in a toolbar inside a form that defaulted to submit would submit
the form.

Default is `false`. The most common avatar is not activatable, and a tab stop on every row of a list is
a cost with no return.

## `initialsFrom` is exported, not just used

"Augusta Ada King" is **AK**, not "AA" — the last word is the surname. Getting that wrong shows two
initials that belong to no one, and a user recognises that immediately.

```ts
initialsFrom("Ada Lovelace"); // "AL"
initialsFrom("Augusta Ada King"); // "AK"
initialsFrom("Ada"); // "AD"
initialsFrom("A"); // "A"
```

Exporting it means a consumer deriving initials for an avatar **and** for a comment byline derives them
the same way. It is also the escape hatch for names in scripts where a whitespace split does not apply.

`Avatar` takes `initials` rather than a `name` to derive them from, and that is deliberate: splitting a
display name is a guess, and a component that guesses it gets it wrong for every name that is not
"First Last" — a mononym, a surname-first form, a name with a particle, a name already in Latin script
inside a CJK string. Deriving it at the call site means the component never has to be right about
languages it does not know about.

```tsx
<Avatar initials={initialsFrom(user.displayName)} alt={user.displayName} />
```

## Reconciled design

| Decision      | Choice                    | Why                                                   |
| ------------- | ------------------------- | ----------------------------------------------------- |
| Image failure | falls back to initials    | A revoked URL is normal, and a broken glyph is worse. |
| Both at once  | never                     | "Ada Lovelace, AL" says the same thing twice.         |
| `alt=""`      | no initials either        | The consumer declared the name is already visible.    |
| `interactive` | a real `<button>`         | Tab stop and activation are the platform's, not ours. |
| `type`        | `type="button"` always    | An avatar in a form must not submit it.               |
| Initials      | first + **last**          | The last word is the surname; "AA" belongs to no one. |
| `square`      | not offered               | A hard square is a logo, which is an image.           |
| Badge         | `aria-hidden`             | A presence dot has no announcement.                   |
| Size          | the control height ladder | An avatar lines up with the button beside it.         |

## Keyboard

| Key     | Behaviour                                   |
| ------- | ------------------------------------------- |
| `Tab`   | Reaches the avatar only when `interactive`. |
| `Space` | Activates. Native.                          |
| `Enter` | Activates. Native.                          |

When `interactive` is false there is no tab stop at all. That is the point: a static avatar in a list
of twenty should not cost twenty tab presses.

## CSS contract

```
.uir-avatar              the root, or the <button> when interactive;
                         data-variant, data-size, data-tone,
                         data-interactive, data-has-image,
                         data-disabled
.uir-avatar__image       the <img>; alt is never empty-by-accident
.uir-avatar__initials    the derived or supplied initials
.uir-avatar__glyph       the empty-state mark
.uir-avatar__badge       the decorative overlay; aria-hidden
```

Component-local tokens: `--uir-avatar-radius`, `--uir-avatar-fill`, `--uir-avatar-text`,
`--uir-avatar-initials-size`.

Every child is `overflow: hidden` inside a round or rounded box, so the same four children work for
both variants with no per-variant child rules.

## Accessibility

- A `<div>` by default with no role and no tab stop, which is correct for an image that carries no
  information of its own.
- `<img alt="">` when decorative, `<img alt="Name">` when the image is the name. There is no third
  case: a missing `alt` attribute is a bug in the consumer's markup and this component does not paper
  over it.
- The badge is `aria-hidden`. A count that matters belongs in the accessible name or beside the avatar,
  not in a decorative dot.
- `forced-colors` restates the fill as `Canvas` and the border as `CanvasText`, and the initials as
  `CanvasText`, so an avatar whose tone fill the theme does not know still shows a face with a readable
  initial rather than a solid block.

## Gaps

- **A group / stack.** Overlapping avatars with a `+3` overflow is a common pattern and needs a
  z-index order and a max count, both of which are layout decisions rather than component ones. Build
  it from `Avatar` rather than waiting for it here.
- **A `title`.** Not implemented. On an image avatar the `alt` already carries the name, and a
  browser tooltip over an image that is already labelled is noise.
- **Loading state.** An avatar's image has no meaningful skeleton — the fallback _is_ the loading
  state, and showing a shimmer before the initials appear would be a flash for no gain.
- **`Badge` as a sub-component.** The badge is a `ReactNode` you position yourself, because "where does
  a notification badge go" has more answers than a design system should choose between.
