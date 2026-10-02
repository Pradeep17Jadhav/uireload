# Accessibility

The WAI-ARIA Authoring Practices is the specification for UIReload, not a source of
inspiration. Where APG describes a pattern, the component follows it, including the
parts that are tedious: the tab stop, the escape key, focus restoration.

## Shared primitives

Focus management lives in `src/internal/focus.ts`. Re-deriving it per component is
how libraries end up with three different focus bugs in three different components.

### `useRovingFocus`

For composite widgets: listbox, menu, toolbar, tabs, radio group.

```tsx
const { getItemProps, handleKeyDown } = useRovingFocus({ orientation: "vertical" });

<div role="listbox">
  {items.map((item, index) => (
    <div key={item.id} role="option" {...getItemProps(index)} onKeyDown={handleKeyDown}>
      {item.label}
    </div>
  ))}
</div>;
```

Exactly one member carries `tabindex="0"`; the rest carry `tabindex="-1"`, so the
whole group is a single tab stop. Arrow keys move focus **and** the tab stop, so
tabbing back into the group resumes where the user left off.

| Key                        | Behaviour                                 |
| -------------------------- | ----------------------------------------- |
| `ArrowDown` / `ArrowUp`    | Vertical axis (when `vertical` or `both`) |
| `ArrowRight` / `ArrowLeft` | Inline axis (when `horizontal` or `both`) |
| `Home` / `End`             | First / last item                         |
| Other keys                 | Ignored                                   |

Looping is on by default, matching APG. Pass `loop: false` to clamp at the ends.

The group is read from the DOM at event time, so disabled, filtered and reordered
items are always handled correctly. Reading a stale closure of the item list is the
usual source of roving-focus bugs.

### `useFocusTrap`

For modal surfaces: dialog, drawer, modal popover.

```tsx
const ref = useRef<HTMLDivElement>(null);
useFocusTrap({ active: open, containerRef: ref });

return (
  <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="title">
    ...
  </div>
);
```

- Focus moves to the first tabbable descendant on activation. Pass `initialFocus` to
  choose otherwise, as a ref or a thunk.
- `Tab` and `Shift+Tab` wrap at the boundaries.
- On deactivation, focus returns to whatever was focused before activation.
- A container with nothing tabbable is given `tabindex="-1"` so focus cannot escape
  on the very first `Tab`.
- Set `restoreFocus: false` only if the consumer takes over focus management itself.

Implemented with a scoped capture-phase `keydown` listener and an explicit restore,
**not** sentinel `<div tabindex="-1">` nodes. Sentinels leak into the accessibility
tree as unnamed focus stops and cause most "focus jumped somewhere odd" reports.

## Handler composition

Every component follows one rule:

> The consumer's handler runs first. If it calls `preventDefault()`, our internal
> behaviour is skipped.

```tsx
onClick={composeHandlers(handleInternalClick, onClick)}
```

Consumer-first is the only ordering where `preventDefault()` is a meaningful
opt-out. Running our handler first would mean the state had already changed by the
time the consumer could veto it.

`stopPropagation` is left to the consumer. The DOM already stops delivering the
event; inspecting `cancelBubble` in the library only added a surprising code path.

## Component requirements

For every component:

1. **Role and state.** Follow the APG pattern for the role. Do not add a role the
   pattern does not call for.
2. **Accessible name.** Every interactive element has one. An icon-only control gets
   `aria-label`, or visually hidden text.
3. **Keyboard parity.** Everything reachable by pointer is reachable by keyboard,
   and the keyboard path is documented in the component's `README.md`.
4. **Focus visible.** Never remove a focus outline. `:focus-visible` is the tool for
   showing focus for keyboard users without showing it for mouse users.
5. **State in `data-*`.** `data-state="open"` rather than `.is-open`, so the state is
   inspectable in tests and targetable from consumer CSS.
6. **Colour is never the only signal.** Disabled, invalid and selected states carry
   an attribute or text, not just a colour.
7. **Respect `prefers-reduced-motion`.** Animate through `--uir-duration`, which
   collapses to near-zero for users who opted out. The one exception is continuous
   motion whose rate _is_ the information — currently `Button`'s loading spinner,
   which slows rather than stopping. A stopped spinner reports "not busy", which is
   a lie.

## Controlled state

Components with open/closed or checked state accept `value`, `defaultValue` and
`onChange` via `useControllableState`:

```tsx
const [open, setOpen] = useControllableState({
  value: openProp,
  defaultValue: defaultOpen,
  onChange: setOpenProp,
});
```

- `value === undefined` means uncontrolled.
- The setter identity never changes, so it is safe in effect dependency arrays.
- `onChange` fires only when the value actually changes (`Object.is`).
- Releasing control adopts the last controlled value rather than snapping back to
  `defaultValue`.

Consumers get identical semantics from every component.

## Testing

Use Testing Library queries by role, name and state. They assert what a user can
perceive, and they fail when the ARIA contract breaks.

```tsx
render(<Example />);
expect(screen.getByRole("option", { name: "Two" })).toHaveAttribute("aria-selected", "true");
```

Every component's suite must cover:

1. Rendering and the accessible name.
2. The full keyboard path.
3. Controlled and uncontrolled state.
4. `dir="rtl"`.
5. `axe` reporting zero violations.

Storybook's a11y addon is configured with `test: "error"`, so violations fail the
test run rather than rendering a warning badge nobody reads.

## Verification

- WAI-ARIA APG for the component's pattern.
- `npm run storybook` and check every state, including RTL and high-contrast.
- Keyboard only. Unplug the mouse.
- Zoom to 200% and reflow to a 320 px viewport.
- Windows High Contrast Mode, via the `forced-colors` tokens.

## Known gaps

- **No automated AT testing.** NVDA, JAWS and VoiceOver remain manual checks.
- **`aria-live` politeness** is not centralised yet. Announcements will need a
  consistent pattern; deferring until a component actually announces avoids
  designing it blind.
- **Reduced-motion verification is CSS-only.** There is no test that a JS-driven
  animation respects the preference; a component that animates from JavaScript must
  check it manually.
