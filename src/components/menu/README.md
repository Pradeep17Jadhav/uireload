# Menu

A `role="menu"` of **actions**. The widget to reach for when the choices are commands rather than values.

That distinction is the whole reason this is not a `Select`. A listbox commits a _value_; a menu runs an
_action_. They look similar and behave differently enough that collapsing them into one component with a flag
would be a mistake.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice — is
recorded in `docs/references.md`, which is not published.

## Props

| Prop                  | Type                            | Default    | Notes                                   |
| --------------------- | ------------------------------- | ---------- | --------------------------------------- |
| `items`               | `readonly MenuEntry[]`          | —          | Required.                               |
| `anchor`              | `Element \| RefObject<Element>` | —          | Required. Also the focus-return target. |
| `open`                | `boolean`                       | —          | `undefined` means uncontrolled.         |
| `defaultOpen`         | `boolean`                       | `false`    |                                         |
| `onOpenChange`        | `(open: boolean) => void`       | —          |                                         |
| `onAction`            | `(id: string) => void`          | —          |                                         |
| `label`               | `string`                        | `"Menu"`   | The menu's accessible name.             |
| `initialFocus`        | `"first" \| "last"`             | `"first"`  | Which row is focused on open.           |
| `placement`           | `MenuPlacement`                 | `"bottom"` | Logical sides.                          |
| `offset`              | `number`                        | `4`        | Pixels from the anchor.                 |
| `closeOnEscape`       | `boolean`                       | `true`     |                                         |
| `closeOnOutsidePress` | `boolean`                       | `true`     |                                         |
| `className`           | `string`                        | —          |                                         |
| `ref`                 | `Ref<HTMLDivElement>`           | —          |                                         |

`MenuItem` is `{ id, label, role?, checked?, disabled?, icon?, description?, closeOnSelect?, onSelect? }`.
A separator is `{ type: "separator" }`.

## The trigger is the consumer's button, and the menu completes it

```tsx
const trigger = useRef<HTMLButtonElement>(null);
const [open, setOpen] = useState(false);

<button
  type="button"
  ref={trigger}
  onClick={() => setOpen(true)}
  aria-label="Edit"
>
  Edit
</button>

<Menu anchor={trigger} open={open} onOpenChange={setOpen} items={items} label="Edit menu" />
```

The pattern requires `aria-haspopup="menu"` and `aria-expanded` on the element that opens the menu, and
getting it wrong is **silent**: the menu opens perfectly for a mouse user, and a screen reader announces a
plain button that mysteriously reveals a list.

So the menu writes both onto its `anchor` and restores whatever was there before on unmount. There is no
copy-paste to get wrong. Do **not** set them yourself as well — the menu owns them for as long as it is open.

## Keyboard

| Key                        | Action                                 |
| -------------------------- | -------------------------------------- |
| `Enter` / `Space`          | Activate the focused row.              |
| `ArrowDown` / `ArrowUp`    | Next / previous row, wrapping.         |
| `Home` / `End`             | First / last row.                      |
| Any printable character    | Move to the next row starting with it. |
| `Escape`                   | Close and return focus to the trigger. |
| `Tab`                      | **Close**, then move on.               |
| `Ctrl`/`Cmd`/`Alt` + Arrow | **Nothing.** Declined, see below.      |

**Tab closes rather than walking the rows.** A menu is a composite widget: the arrow keys move between items
and Tab leaves. Letting Tab walk the rows would put the user in a list they then have to Tab _out_ of one row
at a time, which is not what Tab means anywhere else.

**Modified arrows are declined.** `Ctrl`/`Cmd` + Arrow is the conventional "open the submenu" chord and
`Alt` + Arrow is a browser navigation chord, so treating either as "next row" would steal a shortcut the page
may legitimately own. The shared roving-focus helper stays generic; each component decides.

## Checkable items do not close the menu

`menuitem` closes on activation. `menuitemcheckbox` and `menuitemradio` **do not** — someone adjusting three
switches expects to adjust three switches and not to be thrown out of the menu after each one.

`closeOnSelect` overrides this in either direction.

`checked` is controlled by the caller. The menu reports the activation and never changes it, so a checkbox
item in a menu behaves exactly like a checkbox outside one.

## `aria-checked` is required, so it is always present

For the two checkable roles `aria-checked` is emitted unconditionally, defaulting to `"false"`. An unchecked
box is `false`, not absent — omitting the attribute leaves a menu item with an incomplete role, which
assistive technology reports as a critical failure.

A plain `menuitem` carries **no** checked state at all: the attribute is not valid for that role.

## Disabled items stay reachable

A disabled row is `aria-disabled` and **still focusable**, as the pattern requires. A row missing from the
arrow-key sequence is a gap the user cannot account for; a row they can see and cannot use at least explains
itself. Clicking one does nothing.

The pointer cursor is `default` rather than `not-allowed`, because the pointer never does anything there.

## Focus: roving tabindex, not `aria-activedescendant`

The pattern accepts either. Roving is used because it puts real DOM focus on the row — which every assistive
technology already agrees about — and because it matches the rest of the library.

Focus is moved into the menu **on open**. This is the one step a menu is easy to get silently wrong: a menu
that opens with focus still on the trigger looks fine and is unusable, because every arrow key lands on the
page instead.

`initialFocus="last"` is what a trigger opened with the Up Arrow should pass, since that key means "the end of
the list".

## Why this is not built on the popover component

A popover is `role="dialog"`, and the pattern says the element displaying the items has `role="menu"`.
Wrapping a menu in a dialog would make a screen reader announce **"dialog"** the moment the menu opened, which
is the wrong announcement for a list of commands.

`Select` puts its listbox _inside_ a popover, which is fine — a dialog containing a listbox is still a
listbox. It does not work for a menu, so the surface, portal, dismissal and positioning are assembled from the
same internal primitives the tooltip uses, and no `role="dialog"` is ever rendered.

## Typeahead

A printable character moves focus to the next row starting with it, with a 500 ms buffer so `m` then `a` finds
"Ma…" rather than requiring the letters inside one window.

A fresh buffer searches from the top; a repeat continues from the focused row. That is what makes repeated
characters cycle — typing `s` three times over "Save / Share / Sign out" reaches all three.

## CSS contract

```
.uir-menu               the surface; role=menu, data-placement
.uir-menu__item         one row; role=menuitem*, data-checked, data-disabled,
                        data-menu-id
.uir-menu__icon         leading adornment; aria-hidden
.uir-menu__label        the label
.uir-menu__description   secondary text
.uir-menu__check        the tick; CSS-drawn, aria-hidden
.uir-menu__separator    role=separator, no tab stop
```

Component-local tokens: `--uir-menu-min-width`, `--uir-menu-surface`, `--uir-menu-border`, `--uir-menu-text`,
`--uir-menu-muted`, `--uir-menu-item-height`.

`position: fixed` is in the stylesheet rather than inline so the surface is shrink-to-fit when it is
measured; only `top`/`left` are inline.

Row padding rather than a `gap` on the surface, so a row's hover and focus background reaches the surface's
edge. A gap would leave an uncoloured gutter beside every row — the visual signature of a list that was not
built for this.

The tick and the check column are CSS-drawn from two borders, so both mirror in RTL with no second rule.

## Accessibility

- `role="menu"` with a name — `aria-label`, defaulting to the catalogue's "Menu".
- `aria-haspopup="menu"` and `aria-expanded` written onto the anchor.
- Item roles `menuitem`, `menuitemcheckbox`, `menuitemradio`, with `aria-checked` where required and
  `aria-disabled` where disabled.
- Separators are `role="separator"` with no tab stop; a focusable divider is a row the user can land on and
  cannot use.
- Nothing renders at all when closed. A menu left in the DOM is still reachable by Tab in some assistive
  technology and leaves a `role="menu"` in the tree.
- The menu is portalled to `document.body`, so it escapes any `overflow: hidden` or stacking context between
  it and its trigger.
- In forced colours the surface and border become `Canvas`/`CanvasText` and a checked or focused row becomes
  `Highlight`; left on our own tokens a menu renders transparent and is invisible.

## Gaps

- **Submenus.** Not implemented. A parent item would need `aria-haspopup` and `aria-expanded` of its own plus a
  second surface, and the pattern's Right/Left Arrow behaviour only makes sense for a menubar or a submenu —
  the Menubar pattern describes menus opened from a menu button as not acting on Right Arrow at all. Submenus
  are recorded here rather than half-built.
- **A menubar.** `role="menubar"` is a different widget with a different keyboard contract: Tab moves _into_
  it, and Left/Right move between its items. Not this component.
- **Typeahead across submenus.** Only the open menu's rows are searched, which is what the single-level
  pattern describes.
- **A `menu`-level focus failure mode.** There is no re-focus retry if the surface is replaced mid-open; the
  menu re-focuses on the next open.
