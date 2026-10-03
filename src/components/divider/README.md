# Divider

A rule. The whole design question is whether it is in the accessibility tree or not.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

## Props

| Prop          | Type                         | Default        | Notes                                     |
| ------------- | ---------------------------- | -------------- | ----------------------------------------- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | `vertical` adds `aria-orientation`.       |
| `weight`      | `"thin" \| "thick"`          | `"thin"`       |                                           |
| `label`       | `ReactNode`                  | —              | Horizontal only. Coerces the orientation. |
| `decorative`  | `boolean`                    | `false`        | `role="presentation"`.                    |
| `className`   | `string`                     | —              |                                           |
| `ref`         | `Ref<HTMLDivElement>`        | —              |                                           |

Plus `aria-label` and any other native `<div>` attribute, forwarded to the root.

## A divider renders identically whether or not it is announced

This is the component's whole trap. A plain `<div>` and a `separator` look exactly the same on screen
and are announced completely differently:

```html
<div class="uir-divider" />
<!-- silence -->
<div class="uir-divider" role="separator" />
<!-- "separator" -->
```

So a rule that should be announced and is not is invisible to a sighted reviewer, and a rule that
should not be announced but is produces a stray "separator" in a screen reader's linear reading. That
is why `decorative` exists as an explicit prop rather than being left to a consumer's judgement at
every call site.

## `decorative` uses `role="presentation"`, not `aria-hidden`

`aria-hidden="true"` still lets some screen readers announce a hidden element when focus lands inside
it. The role-based way to remove decoration is to say the element has no role at all, and
`role="presentation"` is that.

Both render identically — same tag, same classes, same data attributes. The only difference is the
role, which is asserted directly in the tests for that reason.

## The label is `aria-label`, and only when it is a string

`role="separator"` is a **structure** role, and structure roles do not take their accessible name from
their contents. The text inside the rule is _not_ its accessible name, however obviously it looks like
one on screen.

So a **string** label is also written to `aria-label`. A `ReactNode` cannot be, and is rendered as
decoration only — `String(node)` is `"[object Object]"`, which is a worse name than none.

## `aria-orientation` is stated only when vertical

`horizontal` is the default value of the attribute, and writing `aria-orientation="horizontal"` on
every rule in an application is redundant markup on every one of them. The `data-orientation`
attribute _is_ always emitted, because that is a styling hook and the stylesheet needs the default
stated to key off it.

## A labelled rule coerces to horizontal

The types forbid `orientation="vertical"` with a `label`. A vertical rule with a label in it has
nowhere to put the text that does not rotate it, and rotated text is a decision a design system
should make deliberately rather than inherit from a prop.

The component **coerces rather than throwing**: a consumer who flips `orientation` while a label is
present gets a usable rule. The coercion is silent, so it is asserted in the tests and repeated here —
if you need a vertical labelled rule, put the two elements side by side yourself.

## Reconciled design

| Decision          | Choice                         | Why                                                                  |
| ----------------- | ------------------------------ | -------------------------------------------------------------------- |
| Role              | `separator`, or `presentation` | A structure role cannot be named from its contents.                  |
| `decorative`      | `role="presentation"`          | `aria-hidden` does not stop an announcement when focus lands inside. |
| Orientation attr  | vertical only                  | `horizontal` is the default; stating it is redundant markup.         |
| Label naming      | `aria-label`, string only      | A `ReactNode` has no string form and `"[object Object]"` is worse.   |
| Labelled vertical | coerced to horizontal          | Rotated text is a decision, not an accident.                         |
| Weight            | `thin` / `thick` only          | A rule that can be any thickness is a rule nothing agrees on.        |
| Element           | always `<div>`                 | There is no other element that is a rule.                            |

## Keyboard

None. A divider is not interactive, has no tab stop, and is not in the accessibility tree as anything
but a separator.

`role="separator"` has an implicit `aria-orientation`, and a **focusable** separator is a different
role with a different purpose — an adjustable window divider. This component never becomes focusable,
so the distinction does not arise.

## CSS contract

```
.uir-divider              the root; data-orientation, data-weight,
                          data-labelled (when labelled)
.uir-divider__label       the in-rule label text
```

Component-local tokens: none.

The rule is drawn with a background colour on the root rather than a `border`, because a
`border-block-start` on a vertical rule and a `border-inline-start` on a horizontal one is two rules
where a rotated pseudo-element or a background on a sized box is one — and because a background
follows the element's box in both writing directions without a direction-specific selector.

## Accessibility

- `role="separator"` unless `decorative`, in which case `role="presentation"`.
- `aria-orientation="vertical"` only when vertical.
- `aria-label` from a string `label`, because a structure role is not named from its contents.
- `forced-colors` needs no special case: the rule is a background colour, and `CanvasText` /
  `Canvas` are restated so a theme that does not know the token still shows a line rather than
  nothing.

## Gaps

- **A `title` or tooltip on a rule.** Not implemented — there is nothing to hover that a sighted user
  cannot already see, and the record is here rather than silently omitted.
- **Adjustable dividers.** A focusable `separator` is a real ARIA role with a keyboard contract
  (`ArrowLeft` / `ArrowRight` to resize). This component is the non-focusable structural kind and does
  not attempt it; a resizable split view is a different component with a different job.
- **Vertical labels.** Rejected rather than deferred, for the reason above. A rotated label is
  readable in Latin script and unusable in most others, so shipping one as a prop would be shipping a
  component that only works in one language.
