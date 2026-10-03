# Reference libraries

**Agent-only file. Not published.** Nothing in this file ships in the package, and nothing in the
published package refers to it.

## Why this file exists

Every component in this library was designed against two real reference implementations rather than
from memory. That work left a large amount of _provenance_: which file and symbol backed each
non-obvious API choice, and which behaviour was copied, renamed, narrowed or deliberately rejected.

Consumers of the package gain nothing from that provenance, and naming third-party libraries in
published type definitions implies a relationship that does not exist — that these components are
ports of, or compatible with, those projects. They are not. They share a problem domain and nothing
else.

So the provenance lives here, and the shipped code carries only the _reasoning_, which is useful to
everyone and mentions nobody.

## How to read the shipped comments

A published comment explains **why a decision was made**, stated in terms of the widget, the ARIA
pattern, WCAG, or platform behaviour. Where a decision was "the obvious competitor library does it
this way and it is right", the shipped comment says what is right rather than who does it.

Examples of the rewrite:

| Shipped as                                  | Reads as                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| "Fiori gates `:hover` on `pointer: fine`"   | "every hover rule here is gated on `pointer: fine`"                                                     |
| "MUI leaves `type` as `string`"             | "Some libraries leave `type` as `string`"                                                               |
| "UI5's `before-close` carries `escPressed`" | "A before-close event often carries `{ escPressed: boolean }`, and a boolean cannot tell the two apart" |

The reasoning is never deleted, only de-attributed. Where a comment was _only_ a citation with no
reasoning attached, it is deleted.

## The two libraries

| Library | Packages                                                  | Path                                                            |
| ------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| A       | `@mui/material`, `@mui/icons-material`, `@emotion/*`      | `../referenceUILibraries/node_modules/@mui/material/`           |
| B       | `@ui5/webcomponents`, `@ui5/webcomponents-fiori`, `-base` | `../referenceUILibraries/node_modules/@ui5/webcomponents/dist/` |

Read-only. Never edit anything under `node_modules/` in either project. See `AGENTS.md` §1–3 for the
navigation rules and the worked example.

## Citation record

### Button — `src/components/button/`

| Concern                    | Source                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition         | `@mui/material/Button/Button.d.ts` — `ButtonOwnProps`                                                                                                                  |
| Class-name contract        | `@mui/material/Button/buttonClasses.d.ts` — `ButtonClasses`                                                                                                            |
| Behaviour, slots, parts    | `@ui5/webcomponents/dist/Button.d.ts` — `design`, `icon`, `endIcon`, `type`, `@csspart button` / `icon` / `endIcon`                                                    |
| Design enum values         | `@ui5/webcomponents/dist/types/ButtonDesign.d.ts`                                                                                                                      |
| Form type enum             | `@ui5/webcomponents/dist/types/ButtonType.d.ts`                                                                                                                        |
| Size / state tokens        | `@ui5/webcomponents/dist/generated/themes/sap_horizon/parameters-bundle.css.js` — `--_ui5_button_base_height`, `_base_min_width`, `_base_padding`, `_base_icon_margin` |
| Hover gating               | `@ui5/webcomponents/dist/css/themes/Button.css` — `:not([_is-touch])` around `:hover`                                                                                  |
| Unfilled hover/press split | `@ui5/webcomponents/dist/css/themes/Button.css` — `Transparent` design, distinct `_Hover_Background`                                                                   |
| Press timing               | `@ui5/webcomponents/dist/css/themes/Button.css` — `[active]` on mousedown                                                                                              |
| Disabled pointer-events    | `@ui5/webcomponents/dist/css/themes/Button.css` — `pointer-events: unset`                                                                                              |
| Translate crash            | `mui/material-ui#27853`                                                                                                                                                |
| `type` default             | `@mui/material/ButtonBase/ButtonBase.js` — `@default 'button'`                                                                                                         |

### IconButton — `src/components/icon-button/`

| Concern             | Source                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Prop decomposition  | `@mui/material/IconButton/IconButton.d.ts` — `IconButtonOwnProps`                        |
| Icon placement      | `@mui/material/IconButton/IconButton.js` — `children` into the root                      |
| Icon-only handling  | `@ui5/webcomponents/dist/Button.d.ts` + `css/themes/Button.css` — `[icon-only]` branches |
| Template            | `@ui5/webcomponents/dist/ButtonTemplate.js` — icon is a sibling of `ui5-button-text`     |
| Tooltip requirement | `@ui5/webcomponents/dist/Button.d.ts` — `tooltip`                                        |

### Textbox — `src/components/textbox/`

| Concern                                         | Source                                                                                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition                              | `@mui/material/TextField/TextField.d.ts` — `BaseTextFieldProps`; `@mui/material/InputBase/InputBase.d.ts`                                                  |
| `type` vocabulary                               | `@ui5/webcomponents/dist/types/InputType.d.ts` — `Text`, `Email`, `Number`, `Tel`, `URL`, `Password`, `Date`                                               |
| `type` documented as "a valid HTML5 input type" | `@mui/material/InputBase/InputBase.d.ts`                                                                                                                   |
| Parts                                           | `@ui5/webcomponents/dist/Input.d.ts` — `@csspart`                                                                                                          |
| Value-state vocabulary                          | `@ui5/webcomponents/dist/Input.d.ts` — `valueState`, `valueStateMessage`                                                                                   |
| Focus ring on wrapper                           | `@mui/material/OutlinedInput/OutlinedInput.js` — `.Mui-focused`; `@ui5/webcomponents/dist/css/themes/Input.css` — `_ui5-input-focus-outline` via `::after` |
| Required marker                                 | `@mui/material/InputLabel/InputLabel.js` — `::after`                                                                                                       |
| Disabled pointer-events                         | `@mui/material/ButtonBase/ButtonBase.js`                                                                                                                   |

### Switch — `src/components/switch/`

| Concern             | Source                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Prop decomposition  | `@mui/material/Switch/Switch.d.ts`; `@mui/material/internal/SwitchBase.d.ts`                             |
| `readonly` (2.21.0) | `@ui5/webcomponents/dist/Switch.d.ts` — `readonly`, `effectiveAriaReadonly`                              |
| Enter toggles       | `@ui5/webcomponents/dist/Switch.d.ts` — `<div role="switch">` with a `keydown` handler                   |
| Graphical design    | `@ui5/webcomponents/dist/Switch.d.ts` — `SwitchDesign.Graphical`, `textOn` / `textOff`                   |
| Track/handle ratio  | `@ui5/webcomponents/dist/css/themes/Switch.css` — `_ui5_switch_track_width` / `_ui5_switch_handle_width` |
| Hover gating        | `@ui5/webcomponents/dist/css/themes/Switch.css`                                                          |
| Icon props          | `@mui/material/Switch/Switch.js` — `icon` / `checkedIcon`                                                |
| Two-tier sizes      | `@mui/material/Switch/Switch.js` — `small \| medium`                                                     |

### ToggleButton — `src/components/toggle-button/`

| Concern              | Source                                                                       |
| -------------------- | ---------------------------------------------------------------------------- |
| Prop decomposition   | `@mui/material/ToggleButton/ToggleButton.d.ts` — `ToggleButtonOwnProps`      |
| `pressed`            | `@ui5/webcomponents/dist/ToggleButton.d.ts` — adds `pressed` to `ui5-button` |
| Emphasis inheritance | `@mui/material/ToggleButton/ToggleButton.js` — `variant` from `Button`       |

### ToggleButtonGroup — `src/components/toggle-button-group/`

| Concern                   | Source                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Prop decomposition        | `@mui/material/ToggleButtonGroup/ToggleButtonGroup.d.ts` — `ToggleButtonGroupProps`      |
| No role declared          | `@mui/material/ToggleButtonGroup/ToggleButtonGroup.d.ts` and `.js` — no `role`           |
| `selectionMode`           | `@ui5/webcomponents/dist/types/SegmentedButtonSelectionMode.d.ts` — `Single \| Multiple` |
| Arrow-key item navigation | `@ui5/webcomponents/dist/SegmentedButton.d.ts` — `ItemNavigation`                        |
| Seam                      | `@ui5/webcomponents/dist/css/themes/SegmentedButton.css` — `:host(:not(:first-child))`   |
| Boolean alternative       | `@mui/material/ToggleButtonGroup/ToggleButtonGroup.d.ts` — `exclusive`                   |

### Popover — `src/components/popover/`

| Concern              | Source                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Prop decomposition   | `@mui/material/Popover/Popover.d.ts` — `PopoverProps`                                    |
| Virtual element      | `@mui/material/Popover/Popover.d.ts` — `PopoverVirtualElement`                           |
| Placement vocabulary | `@ui5/webcomponents/dist/types/PopoverPlacement.d.ts` — `Start`, `End`, `Top`, `Bottom`  |
| Two align enums      | `@ui5/webcomponents/dist/types/PopoverVerticalAlign.d.ts`, `PopoverHorizontalAlign.d.ts` |
| Viewport margin      | `@ui5/webcomponents/dist/Popover.d.ts` — `VIEWPORT_MARGIN`                               |
| Anchor-out-of-view   | `@ui5/webcomponents/dist/Popover.d.ts` — `IntersectionObserver`                          |
| Parts                | `@ui5/webcomponents/dist/Popover.d.ts` — `@csspart header` / `content` / `footer`        |
| Close reason         | `@ui5/webcomponents/dist/Popover.d.ts` — `before-close`, `{ escPressed }`                |
| Arrow                | `@ui5/webcomponents/dist/Popover.d.ts` — `hideArrow`                                     |
| Element duck-typing  | `@ui5/webcomponents/dist/types/UI5AbstractElement.d.ts` — `isUI5AbstractElement`         |
| Portal               | `@mui/material/Modal/Modal.d.ts` — `container`                                           |

### Dialog — `src/components/dialog/`

| Concern              | Source                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition   | `@mui/material/Dialog/Dialog.d.ts` — `DialogProps`                                                                                    |
| Close reasons        | `@mui/material/Dialog/Dialog.d.ts` — `(event, reason)`, `"escapeKeyDown" \| "backdropClick"`                                          |
| Role derivation      | `@ui5/webcomponents/dist/Dialog.d.ts` — `_role`: `Negative` / `Critical` → `alertdialog`                                              |
| Modality             | `@ui5/webcomponents/dist/Popup.d.ts` — `blockPageScrolling`, `applyInitialFocus`, `resetFocus`, `preventFocusRestore`, `initialFocus` |
| Value-state enum     | `@ui5/webcomponents-base/dist/types/ValueState.d.ts`                                                                                  |
| Parts                | `@ui5/webcomponents/dist/Dialog.d.ts` — `@csspart header` / `content` / `footer`                                                      |
| Region labels        | `@ui5/webcomponents/dist/Dialog.d.ts` — `_headerAriaLabel`, `_contentAriaLabel`, `_footerAriaLabel`                                   |
| Phone recommendation | `@ui5/webcomponents/dist/Dialog.d.ts` — `stretch`                                                                                     |
| Desktop width        | `@ui5/webcomponents/dist/Dialog.d.ts` — "approximately 90% of the viewport"                                                           |

### Select — `src/components/select/`

| Concern                | Source                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition     | `@mui/material/Select/Select.d.ts` — `SelectProps`                                                                                                              |
| Form integration       | `@mui/material/Select/Select.d.ts` — `InputProps` / `FormControl`; hidden `<input name>`                                                                        |
| Keyboard               | `@ui5/webcomponents/dist/Select.d.ts` — the `keydown` block: `[F4] / [Alt]+[Up] / [Alt]+[Down] / [Space] or [Enter]`, `[ESC]`, `[Home] / [End]`, type-to-select |
| Typeahead timing       | `@ui5/webcomponents/dist/Select.d.ts` — `_typingTimeoutID`, 1000 ms                                                                                             |
| Option model           | `@ui5/webcomponents/dist/Select.d.ts` — `SelectOption`, `OptionCustom`, `value` as `@formProperty`                                                              |
| Grouping               | `@ui5/webcomponents/dist/Select.d.ts` — `<ui5-option-group>`, `headerText`, `_groupCountText`                                                                   |
| Unmatched value        | `@ui5/webcomponents/dist/Select.d.ts` — "no option will be selected and the Select component will be displayed as empty"                                        |
| Empty-value state      | `@ui5/webcomponents/dist/Select.d.ts` — `_isNoValue`                                                                                                            |
| Responsive placement   | `@ui5/webcomponents/dist/ResponsivePopover.d.ts` — `Bottom` desktop, `Left`/`Right` phone                                                                       |
| Required marker        | `@mui/material/InputLabel/InputLabel.js` — `::after`                                                                                                            |
| Highlighting behaviour | `@mui/material/Select/SelectInput.js` — highlights while arrowing (the behaviour rejected here)                                                                 |

### Checkbox - `src/components/checkbox/`

| Concern                     | Source                                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition          | `@mui/material/Checkbox/Checkbox.d.ts` - `CheckboxSlots` (`root`, `input`), size/colour overrides                                                              |
| Indeterminate contract      | `@ui5/webcomponents/dist/CheckBox.d.ts` - `indeterminate` property, and the ordering rule (indeterminate wins over checked; unchecked wins over indeterminate) |
| Click order                 | `@ui5/webcomponents/dist/CheckBox.d.ts` - a `<div role="checkbox">` with `onclick`                                                                             |
| Tick drawn from two borders | `@ui5/webcomponents/dist/css/themes/CheckBox.css` - the checkmark is a rotated border pair, not an SVG                                                         |
| Hover gating                | `@ui5/webcomponents/dist/css/themes/CheckBox.css` - `:hover` behind `pointer: fine`                                                                            |
| No `readOnly`               | `@ui5/webcomponents/dist/CheckBox.d.ts` - offers `readonly`; `@ui5/webcomponents/dist/Switch.d.ts` documents why it cannot be honoured on an input             |

Rejected: `icon` / `checkedIcon` (`@mui/material/Checkbox/Checkbox.d.ts`) — the tick is two borders,
so there is nothing to import. `color` (same file) — tone is a local token, not a palette key.

### RadioGroup - `src/components/radio-group/`

| Concern                    | Source                                                                                                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition         | `@mui/material/RadioGroup/RadioGroup.d.ts` - `RadioGroupProps`: `defaultValue`, `name`, `onChange(event, value)`, `value`                                                                                            |
| Group inherits a form role | `@mui/material/RadioGroup/RadioGroup.d.ts` - `Omit<FormGroupProps, 'onChange'>`                                                                                                                                      |
| Keyboard handling          | `@ui5/webcomponents/dist/RadioButton.d.ts` - "Space and Enter select; Arrow Down/Up and Arrow Left/Right change selection between next/previous radio buttons in one group, while TAB and SHIFT+TAB leave the group" |
| Cannot deselect            | `@ui5/webcomponents/dist/RadioButton.d.ts` - "If `ui5-radio-button` is not part of a group, it can be selected once, but can not be deselected back"                                                                 |
| `textValue`                | `@ui5/webcomponents/dist/Item.d.ts` - `textValue` for a display string separate from content                                                                                                                         |
| Per-option disabled        | `@mui/material/Radio/Radio.d.ts` - `disabled`; `@ui5/webcomponents/dist/RadioButton.d.ts` - arrows skip it                                                                                                           |
| Two sizes                  | `@mui/material/Radio/Radio.d.ts` - `small \| medium`                                                                                                                                                                 |

Rejected: children-based options (`<RadioGroup><Radio/></RadioGroup>`, every counterpart) — the
component takes a typed `options` array instead; see the component README for the reasoning.
Rejected: `row` (`@mui/material/FormGroup/FormGroup.d.ts`) as a boolean — replaced by `orientation`,
which also drives the arrow axis. `color` — tone is a local token. Enter-to-select
(`@ui5/webcomponents/dist/RadioButton.d.ts`) — a real `<input type="radio">` is activated by Space;
Enter is the platform's submit key and binding it here would swallow form submission.

### Chip - `src/components/chip/`

| Concern               | Source                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Prop decomposition    | `@mui/material/Chip/Chip.d.ts` - `ChipOwnProps`: `label`, `icon`, `avatar`, `deleteIcon`, `onDelete`, `clickable`, `variant`, `size`       |
| Slot names            | `@mui/material/Chip/Chip.d.ts` - `ChipSlots` (`root`, `label`)                                                                             |
| Design enum           | `@ui5/webcomponents/dist/types/TagDesign.d.ts` - `Neutral`, `Information`, `Positive`, `Negative`, `Critical`, plus two colour-scheme sets |
| Interactive contract  | `@ui5/webcomponents/dist/Tag.d.ts` - `interactive: boolean`, "focusable and pressable", default `false`                                    |
| State icon per design | `@ui5/webcomponents/dist/Tag.d.ts` - `hideStateIcon`, `_semanticIconName` per design                                                       |
| Single styleable part | `@ui5/webcomponents/dist/Tag.d.ts` - `@csspart root` only                                                                                  |
| Wrapping              | `@ui5/webcomponents/dist/Tag.d.ts` - `wrappingType`; our own single-line truncation rule                                                   |
| Text in a tag         | `@ui5/webcomponents/dist/Tag.d.ts` - "strongly recommended that you only use text in order to preserve the intended design"                |

Rejected: `avatar` (`@mui/material/Chip/Chip.d.ts`) — an avatar in a chip is an `icon` holding an
`<img>`, and a dedicated slot would be a prop with no behaviour. `clickable` plus `deleteIcon` as
separate booleans — collapsed into the three-state `intent`, because a chip that is both activatable
and removable has two tab stops and two accessible names. `nativeButton`
(`@mui/material/Chip/Chip.d.ts`) — `intent` always decides the element, so that choice is never the
consumer's. `colorScheme` (`@ui5/webcomponents/dist/Tag.d.ts`, 1-10) — a ten-step hue ramp is not the
tone ladder. `color` — tone is a local token, not a palette key.

### Slider - `src/components/slider/`

| Concern                | Source                                                                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition     | `@mui/material/Slider/Slider.d.ts` - `SliderOwnProps`: `min`, `max`, `step`, `value`, `defaultValue`, `onChange`, `onChangeCommitted`, `marks`, `orientation`, `track`, `getAriaValueText`, `valueLabelDisplay`                                                     |
| One value or many      | `@mui/material/Slider/Slider.d.ts` - `value: number \| number[]`; ours is always `readonly number[]`                                                                                                                                                                |
| `disableSwap`          | `@mui/material/Slider/Slider.d.ts` — exists because two thumbs can cross; our neighbour clamp makes that unreachable, and the component README records the divergence                                                                                               |
| Keyboard handling      | `@ui5/webcomponents/dist/Slider.d.ts` — "Left or Down Arrow ... Right or Up Arrow ... `Plus` / `Minus` ... `Home` ... `End` ... `Page Up` / `Page Down` ... `Escape` - Resets the value property after interaction, to the position prior the component's focusing" |
| Coarse step is a tenth | `@ui5/webcomponents/dist/Slider.d.ts` — "Moves the handle to the left with step equal to 1/10th of the entire range"                                                                                                                                                |
| Styleable parts        | `@ui5/webcomponents/dist/Slider.d.ts` - `@csspart progress-container`, `progress-bar`, `handle`                                                                                                                                                                     |
| A zero step disables   | `@ui5/webcomponents/dist/Slider.d.ts` — `step`: "If set to 0 the slider handle movement is disabled"                                                                                                                                                                |

Rejected: `scale` (`@mui/material/Slider/Slider.d.ts`) — a logarithmic value mapping with no keyboard
or form-submission story; recorded as a gap rather than half-built. `shiftStep`
(`@mui/material/Slider/Slider.d.ts`) — a second step size for one modifier key, when `PageUp` already
covers coarse movement on every platform. `marks` as a boolean — a boolean can only mean "evenly
spaced", which is a decision about layout dressed up as a value. `color` — tone is a local token.
The Ctrl/Cmd coarse step: implemented as `PageUp` / `PageDown` rather than a modifier, because a
modifier-only shortcut is undiscoverable and unavailable on a numeric keypad.

### Text - `src/components/text/`

| Concern            | Source                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition | `@mui/material/Typography/Typography.d.ts` - `TypographyOwnProps`: `align`, `gutterBottom`, `noWrap`, `variant`, `component`, `variantMapping` |
| Level is the rank  | `@ui5/webcomponents/dist/types/TitleLevel.d.ts` — "H1 = Renders `h1` tag", one entry per level                                                 |
| Level prop naming  | `@ui5/webcomponents/dist/Title.d.ts` — `level` and `size`, both typed as `TitleLevel`                                                          |
| Wrapping           | `@ui5/webcomponents/dist/Title.d.ts` - `wrappingType`; our own single-line truncation rule                                                     |

Rejected: `variantMapping` (`@mui/material/Typography/Typography.d.ts`) — a map from a visual variant
to an element is exactly the two-sources-of-one-fact problem the component removes; `as` is the
narrow, explicit escape hatch instead. `color` as a palette key
(`@mui/material/Typography/Typography.d.ts`) — replaced by `tone`, which defaults to `inherit` because
a text component cannot see what it sits on. `size` as a separate axis
(`@ui5/webcomponents/dist/Title.d.ts`, where `size` and `level` are both `TitleLevel`) — collapsed into
`variant`.

### Title - recorded as not implemented

A request for a separate `Title` component is recorded in `src/components/text/README.md` rather than
answered with a thin alias over `Text`. The counterpart in each reference library
(`@mui/material/Typography` and `@ui5/webcomponents/dist/Title.d.ts`) is a heading, and this library's
`Text` already renders real heading elements whose level is their rank — so a `Title` would add a name
and no behaviour.

### Link - `src/components/link/`

| Concern             | Source                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition  | `@mui/material/Link/Link.d.ts` - `LinkOwnProps`: `color`, `underline`, `variant`, `component`                                                                                                        |
| Underline modes     | `@mui/material/Link/Link.d.ts` - `underline: 'none' \| 'hover' \| 'always'`                                                                                                                          |
| Rendering decision  | `@ui5/webcomponents/dist/Link.d.ts` - "If the `href` property is set, the link behaves as the HTML anchor tag (`<a></a>`) and opens the specified URL in the given target frame (`target` property)" |
| `target` constraint | `@ui5/webcomponents/dist/Link.d.ts` - "This property must only be used when the `href` property is set."                                                                                             |
| Modifier-key detail | `@ui5/webcomponents/dist/Link.d.ts` - `altKey`, `ctrlKey`, `metaKey`, `shiftKey` on the click detail                                                                                                 |
| Wrapping            | `@ui5/webcomponents/dist/Link.d.ts` - `wrappingType`; our own break-word rule                                                                                                                        |
| Parts               | `@ui5/webcomponents/dist/Link.d.ts` - `@csspart icon`, `@csspart endIcon`                                                                                                                            |

Rejected: `LinkDesign` (`@ui5/webcomponents/dist/types/LinkDesign.d.ts` — `Default`, `Subtle`,
`Emphasized`) — three named visual modes where this library has one axis that covers them; `color` as a
palette key — `tone` is a local token.

### Tile - `src/components/tile/`

| Concern                | Source                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Elevation              | `@mui/material/Card/Card.d.ts` - `raised?: boolean`                                                              |
| Slot decomposition     | `@mui/material/Alert/Alert.d.ts` - `AlertSlots`: `root`, `icon`, `message`, `action`, `closeButton`, `closeIcon` |
| Single styleable part  | `@ui5/webcomponents/dist/Card.d.ts` - `@csspart root`, `@csspart content`                                        |
| Header / content split | `@ui5/webcomponents/dist/Card.d.ts` - `header: Slot<CardHeader>`, `content: DefaultSlot<HTMLElement>`            |
| Loading state          | `@ui5/webcomponents/dist/Card.d.ts` - `loading: boolean`, `loadingDelay: number`                                 |
| Sticky header          | `@ui5/webcomponents/dist/Card.d.ts` - `stickyHeader: boolean`                                                    |
| Expandable panel       | `@ui5/webcomponents/dist/Panel.d.ts` - `@csspart header-wrapper`, `header`, `content`                            |

Rejected: `raised` as a boolean — folded into a three-tier `elevation`, because "flat" and "raised" as a
boolean pair forces every consumer to remember which polarity means what. `component` as a prop
(`@mui/material/Card/Card.d.ts`) — `as` covers the non-interactive case and `interactive` / `href` cover
the interactive ones, so a general override would be a third answer to a question with two.
`CardHeader` as a required slot — `header` takes arbitrary content, which is what a slot system is for
and what a props API for one slot is not. The accordion behaviour of `@ui5/webcomponents/dist/Panel.d.ts`
is a different component.

### TabBar - `src/components/tab-bar/`

| Concern                | Source                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition     | `@mui/material/Tabs/Tabs.d.ts` - `vertical`, `value`, `onChange`, `orientation`, `scrollButtons`, `indicator`       |
| Slot names             | `@mui/material/Tabs/Tabs.d.ts` - `TabsSlots`: `root`, `scroller`, `list`, `scrollbar`, `indicator`, `scrollButtons` |
| The `tab-select` event | `@ui5/webcomponents/dist/TabContainer.d.ts` - `"tab-select": TabContainerTabSelectEventDetail`                      |
| Fast-navigation group  | `@ui5/webcomponents/dist/TabContainer.d.ts` - "F6 / Shift+F6 / Ctrl+Alt+Down or Ctrl+Alt+Up"                        |
| Parts                  | `@ui5/webcomponents/dist/TabContainer.d.ts` - `@csspart content`, `@csspart tabstrip`                               |
| Tab state              | `@ui5/webcomponents/dist/Tab.d.ts` - `selected: boolean`, `disabled: boolean`, `design`, `movable`                  |
| `forcedTabIndex`       | `@ui5/webcomponents/dist/Tab.d.ts` - the roving tabindex, as an implementation detail                               |
| Overflow into a menu   | `@ui5/webcomponents/dist/Tab.d.ts` - `getElementInOverflow`, `forcedStyleInOverflow`, `posinset`, `setsize`         |

Rejected: `TabSeparator` (`@ui5/webcomponents/dist/TabSeparator.d.ts`) — a non-interactive divider
between groups of tabs, which is a layout element and not a tab; it can be a consumer's own element
between two `TabBar`s. Drag-to-reorder (`@ui5/webcomponents/dist/TabContainer.d.ts` - `move-over`,
`move`) — a second interaction layered on selection, with its own live-region announcement; recorded as a
gap. `TabInOverflow` (`@ui5/webcomponents/dist/Tab.d.ts`) — the overflow dropdown, which is a different
component with its own keyboard contract. The F6 fast-navigation group — it requires importing an
opt-in module and is a global convention rather than a component behaviour.

### Snackbar - `src/components/snackbar/`

| Concern                | Source                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Close reason enum      | `@mui/material/Snackbar/Snackbar.d.ts` - `SnackbarCloseReason = 'timeout' \| 'clickaway' \| 'escapeKeyDown'`                                                    |
| `onClose` signature    | `@mui/material/Snackbar/Snackbar.d.ts` - "Can be: `"timeout"` (`autoHideDuration` expired), `"clickaway"`, or `"escapeKeyDown"`"                                |
| Auto-hide duration     | `@mui/material/Snackbar/Snackbar.d.ts` - `autoHideDuration: number \| null`                                                                                     |
| Placement              | `@mui/material/Snackbar/Snackbar.d.ts` - `vertical: 'top' \| 'bottom'`, `horizontal: 'left' \| 'center' \| 'right'`, `anchorOrigin`                             |
| Slots                  | `@mui/material/Snackbar/Snackbar.d.ts` - `root`, `content`, `clickAwayListener`, `transition`                                                                   |
| Message and action     | `@mui/material/SnackbarContent/SnackbarContent.d.ts` - `message`, `action`                                                                                      |
| Duration and placement | `@ui5/webcomponents/dist/Toast.d.ts` - `duration: number`, `placement: ToastPlacement`, `open: boolean`                                                         |
| Duration floor         | `@ui5/webcomponents/dist/Toast.d.ts` - "If the minimum duration is lower than 500ms, we force" — the existence of a forced floor is the finding; ours is 5000ms |
| Pause on hover / focus | `@ui5/webcomponents/dist/Toast.d.ts` - `hover: boolean`, `focusable`, `focused`, `_onfocusinFn`, `_onfocusoutFn`, `_onmouseoverFn`, `_onmouseleaveFn`           |
| Dismiss event          | `@ui5/webcomponents/dist/MessageStrip.d.ts` - `close: void`, `hideCloseButton`                                                                                  |
| Design enum            | `@ui5/webcomponents/dist/types/MessageStripDesign.d.ts`, `@ui5/webcomponents/dist/types/ToastPlacement.d.ts`                                                    |

Rejected: `ToastPlacement`'s nine values (`@ui5/webcomponents/dist/types/ToastPlacement.d.ts`) — the
three middle placements are not used by a transient message, and logical names mirror in RTL without a
second prop set. `transition` / `TransitionProps` (`@mui/material/Snackbar/Snackbar.d.ts`) — a
motion library's slot in a library whose stated position is that motion is not its concern.
`disableWindowBlurListener` (same file) — pausing on window blur is a desktop-only concern, and the
pointer and focus pauses here cover the cases that actually lose the user's place. `clickaway` as a
reason rather than `dismiss` — it names the mechanism rather than the intent, so it cannot also carry a
close-button press.

### Divider - `src/components/divider/`

| Concern        | Source                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prop surface   | `@mui/material/Divider/Divider.d.ts` - `orientation`, `variant`, `flexItem`, `textAlign`, `absolute`, `children`                                                   |
| Root element   | `@mui/material/Divider/Divider.d.ts` - `defaultComponent: RootComponent`, `RootComponent extends React.ElementType = 'hr'`                                         |
| Semantic name  | The `<hr>` element's implicit `role="separator"`, with `children` removing the role entirely - the same rule `role="presentation"` implements here                 |
| Label position | `@mui/material/Divider/Divider.d.ts` - `textAlign: 'center' \| 'right' \| 'left'`; the label centred by default is the finding, the physical alignment is rejected |
| No counterpart | No `Divider`, `Separator` or `HR` tag exists in either library's `dist/`; a rule is composed from borders by the consumer there                                    |

Rejected: `absolute` (`@mui/material/Divider/Divider.d.ts`) - absolute positioning inside a scrolling
container is a layout decision the consumer owns. `variant: fullWidth | inset | middle` (same file) -
three widths for the same rule, which is a spacing decision rather than a component state; `weight` is
the one axis that changes what the thing _is_. `flexItem` (same file) - a flex-child fix, not a prop.
`textAlign` (same file) - physical, and it names a property rather than a state. Rotated text for a
vertical labelled rule exists in neither library and was rejected here: it is readable in Latin script
and unusable in most others.

### Skeleton - `src/components/skeleton/`

| Concern              | Source                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Prop surface         | `@mui/material/Skeleton/Skeleton.d.ts` - `variant`, `animation`, `width`, `height`, `children`                   |
| Shape vocabulary     | `@mui/material/Skeleton/Skeleton.d.ts` - `variant: 'text' \| 'rectangular' \| 'rounded' \| 'circular'`           |
| Number or string     | `@mui/material/Skeleton/Skeleton.d.ts` - `width?: number \| string`, `height?: number \| string`                 |
| Animation vocabulary | `@mui/material/Skeleton/Skeleton.d.ts` - `animation: 'pulse' \| 'wave' \| false`                                 |
| Root element         | `@mui/material/Skeleton/Skeleton.d.ts` - `defaultComponent: RootComponent`, `extends React.ElementType = 'span'` |
| No counterpart       | No `Skeleton` or placeholder tag exists in either library's `dist/`; a busy region is assembled by hand there    |

Rejected: `rectangular` (`@mui/material/Skeleton/Skeleton.d.ts`) - a hard-cornered block is a shape
nothing on a page uses, so `rounded` is the block and there is no third value. `'pulse' | 'wave'`
(same file) - two animations for one job; the difference is decorative and a component that ships both
is a component with a preference to maintain. `children` (same file) - a skeleton with content in it is
not a skeleton. `<span>` as the root (same file) - a span cannot take the block sizing a placeholder
needs. Neither library has any accessibility surface for a loading placeholder at all, which is why
`role="status"`, `aria-busy` and the `aria-hidden` bars here have no citation and are recorded as this
component's own answer to the APG live-region pattern.

### Navbar - `src/components/navbar/`

| Concern            | Source                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmark element   | `@mui/material/AppBar/AppBar.d.ts` - `position`, `color`, `square`, `enableColorOnDark`, `elevation`                                          |
| Toolbar container  | `@mui/material/Toolbar/Toolbar.d.ts` - `variant`, `disableGutters`, `children`                                                                |
| Brand slot         | `@ui5/webcomponents-fiori/dist/ShellBar.d.ts` - `logo`, `icon`, `branding`                                                                    |
| Trailing actions   | `@ui5/webcomponents-fiori/dist/ShellBar.d.ts` - `actions`, `items`, `count`                                                                   |
| Overflow behaviour | `@ui5/webcomponents-fiori/dist/ShellBar.d.ts` - `collapsed`, `expanded`, `hiddenItemsIds`, `breakpointSize`                                   |
| Search integration | `@ui5/webcomponents-fiori/dist/ShellBar.d.ts` - `hideSearchButton`, `disableSearchCollapse`                                                   |
| Navigation list    | `@ui5/webcomponents-fiori/dist/SideNavigation.d.ts` - `items`, `subItems`, `fixedItems`, `accessibleName`                                     |
| Collapsed sidebar  | `@ui5/webcomponents-fiori/dist/SideNavigation.d.ts` - `collapsed`, `inPopover`, `header`                                                      |
| Current item       | The APG has no navigation pattern; `aria-current="page"` is the ARIA specification's own mechanism, and neither library exposes a prop for it |
| Keyboard contract  | The APG defines no widget pattern for navigation, so no keyboard contract is cited — `Tab` through the links is the whole story               |

Rejected: `color`, `enableColorOnDark` and `elevation` (`@mui/material/AppBar/AppBar.d.ts`) - there is no
theme object and no palette to key into; colour is `--uir-*` tokens and `data-*`. `square` (same file) - a
border-radius decision that this component does not vary. `variant` and `disableGutters`
(`@mui/material/Toolbar/Toolbar.d.ts`) - padding and density are already the `size` prop and the spacing
tokens. `collapsed` / `expanded` / `hiddenItemsIds` / `breakpointSize`
(`@ui5/webcomponents-fiori/dist/ShellBar.d.ts`) - a responsive collapse is a layout decision about the whole
page, and the threshold is the consumer's; guessing one would surprise consumers who have already solved it.
`hideSearchButton` and `disableSearchCollapse` (same file) - search is content, and belongs in `actions` where
a `Textbox` or a `Menu` can be placed. `items` and `subItems`
(`@ui5/webcomponents-fiori/dist/SideNavigation.d.ts`) - a data-driven `items` array is this component's whole
API; `subItems` is a nested navigation tree, which is a different widget. `inPopover` (same file) - the same
responsive-collapse concern as `ShellBar`. `fixedItems` (same file) - pinning a group within the bar is a
layout concern the stylesheet owns; a consumer overrides `position` per item if they need it.

Neither library attaches `aria-current` to the current entry, and neither declares a keyboard contract, so
both of this component's most important behaviours are recorded here as this repository's own answer rather
than as a citation. That is why the landmark name and `aria-current="page"` are documented as the component's
entire accessibility contract in its README.

### Menu - `src/components/menu/`

| Concern               | Source                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Trigger binding       | `@ui5/webcomponents/dist/Menu.d.ts` - `opener?: HTMLElement \| string \| null`, plus `anchorEl` in the equivalent React component |
| Open state            | `@ui5/webcomponents/dist/Menu.d.ts` - `open: boolean`                                                                             |
| Item row semantics    | `@ui5/webcomponents/dist/MenuItem.d.ts` - `checked: boolean`, `disabled: boolean`, `text?`, `icon?`, `additionalText?`            |
| Grouping and dividers | `@ui5/webcomponents/dist/Menu.d.ts` - items may be menu items, groups or separators                                               |
| Popup placement       | `@ui5/webcomponents/dist/Menu.d.ts` - `placement: \`${PopoverPlacement}\``, `horizontalAlign: \`${PopoverHorizontalAlign}\``      |
| Per-item loading      | `@ui5/webcomponents/dist/MenuItem.d.ts` - `loading: boolean`, `loadingDelay`                                                      |
| Positioning primitive | `@mui/material/Menu/Menu.d.ts` - `anchorEl`, `open`, `onClose`, `variant`, `slotProps.paper`                                      |
| Item-level props      | `@mui/material/MenuItem/MenuItem.d.ts` - `selected`, `dense`, `divider`, `disabled`, `autoFocus`                                  |
| Auto-focus policy     | `@mui/material/Menu/Menu.d.ts` - `autoFocus`, `disableAutoFocusItem`                                                              |
| Menu anatomy          | `@mui/material/Menu/Menu.d.ts` - `slotProps.list`, `slotProps.paper`, `slotProps.root`                                            |
| Keyboard contract     | The APG Menu and Menubar patterns: the two libraries declare none, so the pattern is the only source                              |

Rejected: `anchorEl` and `variant` (`@mui/material/Menu/Menu.d.ts`) - one prop choosing between a menu and a
popover is a prop whose legal values are two different widgets; `Menu` is the menu and `Popover` is the
popover, and the two are separate components here. `slotProps.paper` / `slotProps.root` (same file) - there
is no override-object mechanism in this library; state is `data-*` and the surface is styled from tokens.
`autoFocus` and `disableAutoFocusItem` (same file) - the pattern requires focus to move into the menu when it
opens, so there is no compliant way to leave it on the trigger; which row is focused is exposed as
`initialFocus` instead. `selected` (`@mui/material/MenuItem/MenuItem.d.ts`) - a menu runs actions rather than
committing a value, so a highlighted "current" item is a listbox concept; `checked` on the two checkable roles
is the menu's own vocabulary. `dense` and `divider` (same file) - spacing is the stylesheet's business, and a
divider is a first-class entry in `items` rather than a boolean on the row above it. `loading` and
`loadingDelay` (`@ui5/webcomponents/dist/MenuItem.d.ts`) - a per-row spinner is a composition of `Spinner`, and
`MenuItem.label` is a `ReactNode`, so a caller who wants one supplies it; `disabled` is the honest signal for
a row that cannot be used. `additionalText` (`MenuItem.d.ts`) - `description` here, because "additional" does
not say whether the text is beside or under the label. `PopoverHorizontalAlign` (`Menu.d.ts`) - alignment
along the cross axis is not a menu decision the caller should make; `placement` already says which logical
side the menu appears on.

The keyboard contract is taken from the APG Menu and Menubar patterns rather than from either library, because
neither declares one. Two pattern details are load-bearing and are implemented as specified: a disabled item is
**focusable** but not activatable, and a checkable item does **not** close the menu on activation while a plain
`menuitem` does. Arrow-key wrapping is marked optional by the pattern and is implemented, matching every native
menu.

Focus is managed with roving tabindex rather than `aria-activedescendant`. The pattern accepts either approach;
roving is chosen because it puts real DOM focus on the row and because the same helper already backs the
library's other composite widgets.

Submenus are recorded as a gap in the component README rather than implemented. The pattern's Right Arrow
behaviour for submenus is only meaningful from a menubar, and it explicitly states that a menu opened from a
menu button does nothing on Right Arrow when the focused item has no submenu — so a single-level menu has no
use for most of the submenu keyboard contract.

### Accordion - `src/components/accordion/`

| Concern                | Source                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural slots       | `@mui/material/Accordion/accordionClasses.d.ts` - `root`, `heading`, `region`, plus `expanded`, `disabled`, `rounded`, `gutters`                                |
| Region wiring          | `@mui/material/Accordion/Accordion.js` - the region slot is given `role: 'region'`, `id: summary.props['aria-controls']`, `'aria-labelledby': summary.props.id` |
| Controlled and default | `@mui/material/Accordion/Accordion.d.ts` - `expanded`, `defaultExpanded`, `onChange?: (event, expanded) => void`                                                |
| Disabled header        | `@mui/material/Accordion/Accordion.js` - `disabled` is forwarded to the summary, whose root is a `ButtonBase`                                                   |
| Heading element        | `@mui/material/Accordion/Accordion.d.ts` - `heading?: React.ElementType`, `slotProps.heading: SlotProps<'h3', ...>`                                             |
| Expand affordance      | `@mui/material/AccordionSummary/AccordionSummary.d.ts` - `expandIcon?: React.ReactNode`                                                                         |
| Header level           | `@ui5/webcomponents/dist/Panel.d.ts` - `headerLevel: \`${TitleLevel}\``; values `H1`–`H6`in`dist/types/TitleLevel.d.ts`                                         |
| Custom header content  | `@ui5/webcomponents/dist/Panel.d.ts` - `header: Slot<HTMLElement>`                                                                                              |
| Collapsed state        | `@ui5/webcomponents/dist/Panel.d.ts` - `collapsed: boolean`                                                                                                     |
| Header parts           | `@ui5/webcomponents/dist/Panel.d.ts` - `@csspart header-wrapper`, `@csspart header`, `@csspart content`                                                         |
| Sticky header          | `@ui5/webcomponents/dist/Panel.d.ts` - `stickyHeader: boolean`                                                                                                  |
| Toggle button naming   | `@ui5/webcomponents/dist/Panel.d.ts` - `useAccessibleNameForToggleButton: boolean`                                                                              |

Rejected: `slotProps` / `slots` (`Accordion.d.ts`) - the library's contract is `data-*` attributes and
`className`/`style` on the root only; there is no override-object mechanism to map onto. `onChange(event,
expanded)` (same file) - an extra unused event argument and a boolean about a panel that this component
identifies by id; `onExpandedChange(id)` carries the same information and nothing else. `disableGutters`
and `square` (same file) - two boolean props describing one visual axis, which is a single `variant` prop
here. `TransitionComponent` / `TransitionProps` (same file) - a transition-technique hook, and height
animation is incompatible with the `hidden` attribute that keeps a collapsed panel out of the tab sequence.
`stickyHeader` (`Panel.d.ts`) - a scroll-position behaviour layered on a disclosure widget; it needs a
scroll container the library does not own, so it is recorded as a gap in the component README. `header` as
a slot (`Panel.d.ts`) - the header here is a button whose only permitted child is its label, so a slot for
arbitrary header content would change the heading's accessible name; `items[].title` is a `ReactNode` and
covers rich labels without touching the structure. `fixed`, `noAnimation`, `accessibleRole`,
`accessibleName` (`Panel.d.ts`) - `ui5-panel` is a generic container that has to be told what it is, whereas
an accordion panel is a region by definition and an accordion is not a landmark.

`AccordionHeadingLevel` excludes `1`: `TitleLevel` offers `H1`, but a document has exactly one `h1` and an
accordion is a section of a page rather than the page itself. `headingLevel` is a prop at all because the
correct value depends on the page's outline, which the library cannot know.

The keyboard contract comes from the APG Accordion pattern rather than from either library, because neither
declares one: the pattern specifies Enter, Space and Tab, and keeps every header and every expanded panel in
the natural tab sequence. Neither library adds arrow-key navigation, so none is implemented here — a roving
tabindex would make Up and Down disagree with the tab order that is actually in force.

### Spinner - `src/components/spinner/`

| Concern              | Source                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| The two modes        | `@mui/material/CircularProgress/CircularProgress.d.ts` - `variant: 'determinate' \| 'indeterminate'`                 |
| Ring width           | `@mui/material/CircularProgress/CircularProgress.d.ts` - `thickness?: number`                                        |
| Diameter             | `@mui/material/CircularProgress/CircularProgress.d.ts` - `size?: number \| string`                                   |
| Track behind the arc | `@mui/material/CircularProgress/CircularProgress.d.ts` - `enableTrackSlot?: boolean`                                 |
| Animation technique  | `@mui/material/CircularProgress/CircularProgress.d.ts` - `disableShrink?: boolean`                                   |
| Size ladder          | `@ui5/webcomponents/dist/BusyIndicator.d.ts` - `size`, values from `dist/types/BusyIndicatorSize.d.ts` (`S`/`M`/`L`) |
| Caption              | `@ui5/webcomponents/dist/BusyIndicator.d.ts` - `text`, `textPlacement` (values `Top`/`Bottom`)                       |
| Show-delay           | `@ui5/webcomponents/dist/BusyIndicator.d.ts` - `delay?: number`                                                      |
| Blocking behaviour   | `@ui5/webcomponents/dist/BusyIndicator.d.ts` - `active`, `focusForward`                                              |
| No a11y surface      | Neither progress tag in either library declares a role, a label or a live-region treatment for its own indicator     |

Rejected: `variant` (`CircularProgress.d.ts`) - the whole reason this component exists as a separate
name is that it has no other mode, so a prop selecting between two states would have one legal value.
`size?: number | string` (same file) - a raw pixel diameter cannot be asked to match a neighbouring
control without the consumer counting pixels; `sm | md | lg` is the shared vocabulary, so a spinner
beside a button can be told to match it. `thickness?: number` (same file) - an absolute ring width, which
closes the arc's gap at small diameters until the ring reads as a solid disc; here the width is a
fraction of `--uir-spinner-size` so the gap scales with it, and the values are `thin | md | thick`.
`disableShrink` (same file) - a knob for one library's two-ring animation technique, not part of any
contract. `enableTrackSlot` (same file) - slot plumbing; the track is always drawn, and a ring with no
track behind it cannot show rotation. `text` / `textPlacement`
(`BusyIndicator.d.ts`) - a caption is content, not an indicator, and this component's job is the ring;
`@ui5/webcomponents/dist/BusyIndicator.d.ts` composes the two differently from a slot. `delay` (same
file) - a product threshold, not a component one: guessing it adds a visible delay to work that is
genuinely fast. `active` / `focusForward` (same file) - that is the blocking overlay form, a different
component with a real focus contract; `aria-busy` on a region plus a spinner inside it is the
composition, and it is recorded as a gap in the component README.

Neither library attaches an accessibility surface to a progress indicator at all - no role, no label, no
live-region policy. The `label`-decides-the-role fork here is therefore this component's own answer, and
it is recorded as such because an unlabelled `progressbar` is an accessibility failure rather than a
style choice.

### Loader - `src/components/loader/`

| Concern            | Source                                                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Range props        | `@mui/material/LinearProgress/LinearProgress.d.ts` - `value`, `min`, `max`                                                                                                                |
| Mode vocabulary    | `@mui/material/LinearProgress/LinearProgress.d.ts` - `variant: 'determinate' \| 'indeterminate' \| 'buffer' \| 'query'`                                                                   |
| Percentage scale   | `@ui5/webcomponents/dist/ProgressIndicator.d.ts` - `value: number`, documented "in percent for the length of the component"                                                               |
| Out-of-range value | `@ui5/webcomponents/dist/ProgressIndicator.d.ts` - "If a value greater than 100 is provided, the percentValue is set to 100"                                                              |
| Show the number    | `@ui5/webcomponents/dist/ProgressIndicator.d.ts` - `hideValue: boolean`, `displayValue?: string`                                                                                          |
| Status tint        | `@ui5/webcomponents/dist/ProgressIndicator.d.ts` - `valueState`; values from `@ui5/webcomponents-base/dist/types/ValueState.d.ts` (`None`/`Positive`/`Critical`/`Negative`/`Information`) |
| Fill and remainder | `@ui5/webcomponents/dist/ProgressIndicator.d.ts` - `@csspart bar`, `@csspart remaining-bar`                                                                                               |

Rejected: `variant` (`LinearProgress.d.ts`) - both references express determinate and indeterminate as
one component with a flag, and it is a reasonable API. Not used here because a caller choosing between
"I know how much is left" and "I do not" is describing their own data, and a flag makes the two shapes
interchangeable in a way they are not. `Spinner` and `Loader` are separate components instead: the value
is optional, and an absent value is the specified indeterminate form of the role (no `aria-valuenow`)
rather than a `0`. `min` (`LinearProgress.d.ts`) - a bar whose zero is not zero cannot be drawn as a
proportion, so the low end is fixed and only `max` is exposed. `buffer` / `query`
(same file) - the buffered amount of a stream is not knowable by a general-purpose loader, so exposing
the variant would be exposing a prop that cannot be honoured. `hideValue` / `displayValue`
(`ProgressIndicator.d.ts`) - two props for one decision, split here into `showValue` for the visible
number and `valueLabel` for text describing the current step, because the two answer different questions
and callers need them independently. `valueState` (same file) - a visual status tint is `tone`, which
this library already has, and the semantic states do not survive the trip to a progress value: a "failed"
bar at 40% tells a screen reader the work is a third done when it has stopped, so there is no dedicated
failure state. Recorded as a gap in the component README.

`@ui5/webcomponents/dist/ProgressIndicator.d.ts` clamps an over-range value to 100 and an invalid one to
0; the same clamp is applied here in JS rather than CSS, because CSS can correct what is drawn and has
no way to correct what is announced.

### Avatar - `src/components/avatar/`

| Concern            | Source                                                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop surface       | `@ui5/webcomponents/dist/Avatar.d.ts` - `initials`, `shape`, `size`, `colorScheme`, `interactive`, `fallbackIcon`, `icon`, `accessibleName`                                                     |
| Slots              | `@ui5/webcomponents/dist/Avatar.d.ts` - `image: DefaultSlot<HTMLElement>`, `badge: Slot<HTMLElement>`                                                                                           |
| Image-failure path | `@ui5/webcomponents/dist/Avatar.d.ts` - `_imageLoadError: boolean`, `_hasImage: boolean`                                                                                                        |
| Accessible mode    | `@ui5/webcomponents/dist/types/AvatarMode.d.ts` - `Image`, `Decorative`, `Interactive`, each documented with the `role` it renders internally (`img`, `presentation` + `aria-hidden`, `button`) |
| Shape vocabulary   | `@ui5/webcomponents/dist/types/AvatarShape.d.ts` - `Circle`, `Square`                                                                                                                           |
| Size ladder        | `@ui5/webcomponents/dist/types/AvatarSize.d.ts` - `XS`, `S`, `M`, `L`, `XL`                                                                                                                     |
| Prop decomposition | `@mui/material/Avatar/Avatar.d.ts` - `src`, `srcSet`, `alt`, `variant`, `sizes`, `children`                                                                                                     |
| Slots              | `@mui/material/Avatar/Avatar.d.ts` - `AvatarSlots`: `root`, `img`, `fallback`                                                                                                                   |
| Shape vocabulary   | `@mui/material/Avatar/Avatar.d.ts` - `variant: 'circular' \| 'rounded' \| 'square'`                                                                                                             |

Rejected: `Square` (`@ui5/webcomponents/dist/types/AvatarShape.d.ts`,
`@mui/material/Avatar/Avatar.d.ts`) - a hard square at avatar sizes is what a company logo wants, which
is an image rather than an avatar; at large sizes it reads as a rounded circle. `Decorative` as a
_mode_ (`@ui5/webcomponents/dist/types/AvatarMode.d.ts`) - the same declarative answer is available by
passing `alt=""`, and a mode that must be kept in sync with `alt` is a second way to be wrong. `colorScheme`
`'Accent1'..'Accent10'` and `Placeholder` / `Transparent` (same file) - twelve scheme values over an
accent ramp is a palette this library does not have; `tone` reuses the library-wide four. `Auto`
(same file) - deriving a colour from a name is a guess a component should not make. `fallbackIcon` and
`children` (`@mui/material/Avatar/Avatar.d.ts`) - an initials fallback is always available and always
correct, so a second fallback is a choice with no correct answer. `srcSet` (same file) - a resolution
concern the `src` prop cannot express but which needs no new API. `AvatarMode` as an explicit prop
(same file) - `interactive` already answers the only question it asks.

### Alert - `src/components/alert/`

| Concern                   | Source                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Slot vocabulary           | `@mui/material/Alert/Alert.d.ts` - `AlertSlots`: `root`, `icon`, `message`, `action`, `closeButton`, `closeIcon`                       |
| Prop surface              | `@mui/material/Alert/Alert.d.ts` - `action`, `icon`, `role`, `onClose`, `closeText`, `severity`, `variant`, `iconMapping`              |
| Severity vocabulary       | `@mui/material/Alert/Alert.d.ts` - `AlertColor = 'success' \| 'info' \| 'warning' \| 'error'`                                          |
| Fill vocabulary           | `@mui/material/Alert/Alert.d.ts` - `variant: 'standard' \| 'filled' \| 'outlined'`                                                     |
| `role` as a prop          | `@mui/material/Alert/Alert.d.ts` - `role?: string`, defaulted to `'alert'`; the existence of an overridable role is the finding        |
| Design vocabulary         | `@ui5/webcomponents/dist/types/MessageStripDesign.d.ts` - `Information`, `Positive`, `Negative`, `Critical`, `ColorSet1`, `ColorSet2`  |
| Parts                     | `@ui5/webcomponents/dist/MessageStrip.d.ts` - `@csspart icon`, `icon: Slot<IIcon>`                                                     |
| Close behaviour           | `@ui5/webcomponents/dist/MessageStrip.d.ts` - `close: void`, `hideCloseButton`, `hideIcon`                                             |
| No live-region vocabulary | Neither API states an `aria-live` value for the message container; the `status` / `alert` split is this component's own reconciliation |

Rejected: `'warning'` (`@mui/material/Alert/Alert.d.ts`) and `Information` / `ColorSet1` / `ColorSet2`
(`@ui5/webcomponents/dist/types/MessageStripDesign.d.ts`) - six or four severities for a message that
has not changed what the user should _do_; a tone has to change the required action, and that is the
argument `docs/foundations.md` already makes for the library-wide four. `'info'` and `'success'` /
`'error'` (same file) - re-mapped onto the library's `neutral` / `positive` / `danger` rather than
carried across, because the names encode a reference library's semantics rather than this one's.
`onClose` firing with the event (`@mui/material/Alert/Alert.d.ts`) - an alert's dismiss has exactly one
reason, so a reason parameter would be a parameter with one legal value, and the consumer does not need
the event. `iconMapping` (same file) - a four-entry lookup table whose whole content is four glyphs, and
`icon` already accepts a node. `closeText` (same file) - one default that is right for every alert, with
`dismissLabel` for the page that has several; the name is retained. `standard` (same file) - renamed to
`subtle` for the same reason `Chip` uses `filled`, since `standard` names nothing. `hideIcon` and
`hideCloseButton` (`@ui5/webcomponents/dist/MessageStrip.d.ts`) - a neutral alert draws no glyph
because a mark beside text that says nothing is decoration, and the dismiss control appears with
`dismissible` rather than being hidden by default.

### Tooltip - `src/components/tooltip/`

| Concern            | Source                                                                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop surface       | `@mui/material/Tooltip/Tooltip.d.ts` - `enterDelay`, `enterNextDelay`, `leaveDelay`, `describeChild`, `disableInteractive`, `arrow`, `followCursor`, `open`, `onOpen`, `onClose`, `placement`, `title`         |
| Slots              | `@mui/material/Tooltip/Tooltip.d.ts` - `tooltip`, `popper`, `transition`, `arrow`                                                                                                                              |
| Enter delay        | `@mui/material/Tooltip/Tooltip.d.ts` - `enterDelay?: number`, `enterNextDelay?: number`                                                                                                                        |
| The grace period   | `@mui/material/Tooltip/Tooltip.d.ts` - `leaveDelay?: number`, documented as "the `tooltip` will remain open as long as the user hovers over the tooltip before the `leaveDelay` is expired"                    |
| Describing a child | `@mui/material/Tooltip/Tooltip.d.ts` - `describeChild?: boolean`; the existence of the flag is the finding, and neither `tooltip` nor `describeChild` chooses between `aria-describedby` and `aria-label`      |
| No counterpart     | **No general `Tooltip` tag exists in the second library's `dist/`.** The only `*Tooltip*` files there are `SliderTooltip.d.ts` and `SliderTooltipTemplate.d.ts`, a slider's value bubble rather than a tooltip |

Rejected: `title` (`@ui5/webcomponents/dist/SliderTooltip.d.ts` - a `value` bubble pinned to a slider
thumb) - it cannot be styled, positioned, shown on focus or reached by touch, which is the whole reason
this component exists. `disableInteractive` (`@mui/material/Tooltip/Tooltip.d.ts`) - here it is the
default, because a surface the pointer cannot enter dismisses as the user moves toward it to read the
last word; the arrow is therefore `pointer-events: none` unconditionally. `disableTouchListener`,
`disableHoverListener`, `disableFocusListener` (same file) - a tooltip with no listener at all is a
focus stop that goes nowhere, so none of the three is offered. `followCursor` (same file) - a tooltip
that follows the pointer cannot be read, because it is never still. `enterNextDelay` (same file) - a
shorter delay for re-entering a _different_ tooltip is a refinement to a delay that should not fire in
the first place. `transition` (same file) - a motion library's slot, in a library whose stated position
is that motion is not its concern. Eight `placement` values (`@mui/material/Tooltip/Tooltip.d.ts`) -
`left` / `right` are `inline-start` / `inline-end` on a vertical axis, so the four logical values plus the
shared flip-and-clamp covers all eight. `aria-label` from `String(label)` - a `ReactNode` has no string
form, so the attribute is applied only when `label` is a string.

### Drawer - `src/components/drawer/`

| Concern                | Source                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Edge vocabulary        | `@mui/material/Drawer/Drawer.d.ts` - `anchor?: 'left' \| 'top' \| 'right' \| 'bottom'`                                                                           |
| Persistence vocabulary | `@mui/material/Drawer/Drawer.d.ts` - `variant?: 'permanent' \| 'persistent' \| 'temporary'`                                                                      |
| Default                | `@mui/material/Drawer/Drawer.js` - `variant = 'temporary'`, the module-level default                                                                             |
| Slots                  | `@mui/material/Drawer/Drawer.d.ts` - `DrawerSlots`: `root`, `docked`, `paper`, `transition`, `backdrop`                                                          |
| Modal inheritance      | `@mui/material/Drawer/Drawer.d.ts` - `DrawerProps extends StandardProps<ModalProps, ...>`, so it inherits the focus trap, scroll lock and `aria-modal` wholesale |
| Collapsible navigation | `@ui5/webcomponents-fiori/dist/SideNavigation.d.ts` - `collapsed: boolean`, `accessibleName`, `items`, `fixedItems`, `header`                                    |
| Fixed vs. overlay      | `@ui5/webcomponents-fiori/dist/SideNavigation.d.ts` - `inPopover: boolean`, `_popoverContents` - the split between a panel in the layout and one over it         |
| No counterpart         | No `Drawer` tag exists in the second library's `dist/`; `SideNavigation` is a navigation list rather than a panel, and has no overlay mode of its own            |

Rejected: `anchor: 'left' | 'right'` (`@mui/material/Drawer/Drawer.d.ts`) - physical, so an RTL consumer
has to think about direction to place a navigation drawer, which is what logical properties exist to
stop; `inline-start` / `inline-end` cover both with no second prop set.
`variant: 'permanent' | 'persistent'` (same file) - three names for two behaviours: a permanent drawer is a
layout column, which is a `Tile` grid rather than an overlay, and a persistent one is this component
with `showClose`. `transition` / `TransitionProps` (same file) - a motion library's slot.
`ModalProps` inheritance (same file) - this component composes the shared portal, scroll-lock and
focus-trap helpers directly so that `modal` can be **off**, which inheriting a `Modal` cannot express.
`collapsed` (`@ui5/webcomponents-fiori/dist/SideNavigation.d.ts`) - a navigation list's own state, and
its popover mode is the overlay case rather than a prop of the panel. `header` and `fixedItems` (same
file) - taken as the `header` and `footer` slots, which is the useful part.

### Pagination - `src/components/pagination/`

| Concern          | Source                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop surface     | `@mui/material/Pagination/Pagination.d.ts` - `PaginationProps extends UsePaginationProps, StandardProps<React.HTMLAttributes<HTMLElement>, 'children' \| 'onChange'>`                                   |
| Core props       | `@mui/material/usePagination/usePagination.d.ts` - `count`, `page`, `defaultPage`, `boundaryCount`, `siblingCount`, `disabled`, `hideNextButton`, `hidePrevButton`, `showFirstButton`, `showLastButton` |
| Item vocabulary  | `@mui/material/usePagination/usePagination.d.ts` - `type: 'page' \| 'first' \| 'last' \| 'next' \| 'previous' \| 'start-ellipsis' \| 'end-ellipsis'`                                                    |
| Item shape       | `@mui/material/usePagination/usePagination.d.ts` - `{ onClick, type, page, selected, disabled }`                                                                                                        |
| Accessible names | `@mui/material/Pagination/Pagination.d.ts` - `getItemAriaLabel?: (type, page, selected) => string`                                                                                                      |
| Shape and fill   | `@mui/material/Pagination/Pagination.d.ts` - `shape: 'circular' \| 'rounded'`, `variant: 'text' \| 'outlined'`, `color`, `size`                                                                         |
| No counterpart   | No pagination tag exists in the second library's `dist/`; there is no `*aginat*` file in either package                                                                                                 |
| No live region   | **Neither API has any live-region or `aria-live` surface.** `getItemAriaLabel` names a control; nothing announces the position after a change                                                           |

Rejected: `renderItem` and `PaginationRenderItemParams`
(`@mui/material/Pagination/Pagination.d.ts`) - an escape hatch that replaces the whole component, at
which point the consumer is writing a pagination control and the library is in the way. `shape` and
`variant` (same file) - two axes for a row of equal squares, and `rounded` on a 40px target stops being
a shape difference. `color` (same file) - the current page is a _position_, carried by `aria-current`;
`aria-current` plus a token is enough and a four-value colour scale on a number row is a chart.
`showFirstButton` / `showLastButton` / `hideNextButton` / `hidePrevButton` as four booleans (same file) -
four independent switches whose four meaningful combinations are one (`showEdges`), and the two "hide"
flags cannot express "hide previous but keep first", which is a real configuration.
`defaultPage` (same file) - `page` is fully controlled here, because the collection being paged is the
consumer's state and a component that keeps its own copy is a component that can disagree with it.
`boundaryCount` (same file) - kept as the always-present first and last rather than a count, because
the ends of a collection are one click away in every configuration or the control has failed at its one
job. The `role="status"` region and `formatMessage`'s `{total}` template are this component's own
answer to the live-region gap both APIs share.

### Stepper - `src/components/stepper/`

| Concern               | Source                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop surface          | `@mui/material/Stepper/Stepper.d.ts` - `activeStep`, `alternativeLabel`, `nonLinear`, `orientation`, `connector`                                     |
| Step prop surface     | `@mui/material/Step/Step.d.ts` - `active`, `completed`, `disabled`, `expanded`, `index`, `StepLabelProps`                                            |
| Step slots            | `@mui/material/Step/Step.d.ts` - `StepSlots`: `root`, `label`, `icon`, `optional`, `completed`, `expanded`, `description`                            |
| Orientation           | `@mui/material/Stepper/Stepper.d.ts` - `orientation?: Orientation`, and the `connector` element's placement rule                                     |
| Step identity         | `@ui5/webcomponents-fiori/dist/WizardStep.d.ts` - `titleText`, `subtitleText`, `icon`, `disabled`, `selected`                                        |
| Branching steps       | `@ui5/webcomponents-fiori/dist/WizardStep.d.ts` - `branching: boolean`                                                                               |
| Separators            | `@ui5/webcomponents-fiori/dist/Wizard.d.ts` - `hideSeparator`, `activeSeparator`, `branchingSeparator`                                               |
| Parts                 | `@ui5/webcomponents-fiori/dist/Wizard.d.ts` - `@csspart navigator`, `@csspart step-content`                                                          |
| Fast-navigation group | `@ui5/webcomponents-fiori/dist/Wizard.d.ts` - `F6` / `Shift+F6` / `Ctrl+Alt+Down`, requiring `@ui5/webcomponents-base/dist/features/F6Navigation.js` |
| Step count            | `@ui5/webcomponents-fiori/dist/Wizard.d.ts` - `ariaSetsize: number`, `ariaPosinset: number`                                                          |

Rejected: `alternativeLabel` (`@mui/material/Stepper/Stepper.d.ts`) - a second presentation of the same
steps, which doubles the strip's content to restate what the state already says. `nonLinear` (same
file) - kept, but **inverted in meaning**: it governs the steps _ahead_ of the current one, whereas a
boolean named after linearity reads as "can I jump anywhere". `connector` as a React element (same
file) - a layout element; the connector here is drawn by the CSS, and `vertical` reuses the same grid so
nothing about the markup changes between orientations. `expanded` and `StepLabelProps` (same file) -
an expandable step is a disclosure, which is a different component. `WizardStep`'s `branching` and
`Wizard`'s `branchingSeparator` (both `@ui5/webcomponents-fiori/dist/Wizard*.d.ts`) - a wizard whose
step list depends on earlier answers needs its own model of which steps exist; this component takes a
flat list and renders what it is given. The F6 fast-navigation group (same file) - it requires
importing an opt-in module and is a global convention rather than a component behaviour, and it is
already rejected for `TabBar` on the same grounds. `ariaSetsize` / `ariaPosinset`
(`@ui5/webcomponents-fiori/dist/Wizard.d.ts`) - the strip is an `<ol>`, which already gives a screen
reader the position and the count; the explicit attributes would say it twice.

### Foundations - `src/foundations.ts`, `src/theme/tokens.css`, `docs/foundations.md`

| Concern               | Source                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Variant vocabulary    | `@mui/material/Button/Button.d.ts` — `variant`; `@ui5/webcomponents/dist/types/ButtonDesign.d.ts`        |
| Tone vocabulary       | `@mui/material/Button/Button.d.ts` — `color`; `@ui5/webcomponents/dist/types/ButtonDesign.d.ts`          |
| Size tiers            | `@mui/material/Button/Button.d.ts` — `small \| medium \| large`                                          |
| Control metrics       | `@ui5/webcomponents/dist/generated/themes/sap_horizon/parameters-bundle.css.js` — `--_ui5_button_base_*` |
| Focus ring metrics    | `@ui5/webcomponents/dist/css/themes/Button.css` — `--_ui5_button_focused_border`                         |
| Unfilled variant wash | `@ui5/webcomponents/dist/css/themes/Button.css` — `Transparent` design tokens                            |

### Icons - `src/icons/`

| Concern                       | Source                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Decorative by default         | `@mui/material/SvgIcon/SvgIcon.js` - `aria-hidden: true` unless `titleAccess` is set; `focusable: "false"` unconditionally                      |
| Named form                    | `@mui/material/SvgIcon/SvgIcon.js` - `role: "img"` plus a `<title>` child when `titleAccess` is set                                             |
| Naming of the accessible name | `@ui5/webcomponents/dist/Icon.d.ts` - `accessibleName`; "Every icon should have a text alternative in order to calculate its accessible name"   |
| Decorative / image / role     | `@ui5/webcomponents/dist/types/IconMode.d.ts` - `Decorative` (`role="presentation"` + `aria-hidden`) vs `Image` (`role="img"`) vs `Interactive` |
| One module per icon           | `@ui5/webcomponents-icons/dist/<name>.js` - the published shape of a large SVG set: a module per glyph, not one barrel                          |
| Grid and sizing               | `@ui5/webcomponents/dist/Icon.d.ts` - "set `font-size` on the `ui5-icon` host element" to control glyph size; `em` adopted for the same reason  |
| Default export per icon       | `@mui/icons-material/<Name>.js` - `exports.default = createSvgIcon(...)`, one named glyph per module                                            |

Rejected: `variant` / `filled` / `outlined` as a runtime prop
(`@mui/icons-material/utils/createSvgIcon.js`) - it is a build-time choice baked into which module
you import, so a prop would mean shipping both variants of every icon to offer one.
Rejected: `fontSize` as an enumerated ladder (`@mui/material/SvgIcon/SvgIcon.js`) - the icon
vocabulary here is the three control tokens plus any CSS length, not a closed scale.
Rejected: an `Icon` component wrapper (`@ui5/webcomponents/dist/Icon.d.ts`) - that element
exists to select a glyph from a registry by name at runtime; a module-per-icon API does not
need a runtime registry, and adding one would put the whole set in every bundle.

The geometry is original. Every glyph is drawn on a shared 24 unit grid from a small set of
primitives, and none of it is traced from either library. What both libraries were read for is
the _API_ above.

Which glyphs to draw, and which to decline, was settled against the same two libraries: a name
that already ships here under another spelling is not drawn again. `Automatic` is a
three-quarter ring with an arrowhead, so there is no `Refresh`; `Create` is a pencil, so there
is no `Edit`; `Approve` is a disc with a tick cut out of it, so there is no `Success`; `Cancel`
is a ring with a cross, so there is no `Error`; `Checklist` is three ticked rows, so there is
neither `Task` nor `Priority`; `FullScreen` is the four arrows, so `Expand` and `Collapse` were
drawn twice and discarded twice - the box-and-arrow form is the same eight pixels either way at
20px.

`Build` is the one entry here that has changed rather than held: it shipped as a toothed cog,
which is a settings glyph under a build glyph's name, so adding `Settings` meant `Build` had to
give the gear up. It is a spanner now, which is what the name always meant. The rule itself is
unchanged - one glyph, one name - and the reason it is recorded is that this was the only way to
add `Settings` without shipping two cogs.

Declined on the same grounds after the third batch of a hundred: `Sms` (`ChatBubble` is already
a bubble with lines), `NavigateBefore` / `NavigateNext` (`SkipPrevious` / `SkipNext` stood up),
`Description` (`Note`), `Percent` (the inside of `LocalOffer`), `Replay` (`Automatic`), `Clear`
(a second `Cancel`), `Pending` / `Brightness` / `Storage` / `Inventory` (against `Timer`, `Sun`,
`Database`, `Dns`), `Hub` (against `Lan`), and `Forum` - the set already had `Chat`,
`ChatBubble` and `Comment`, and a fourth speech bubble is not a fourth idea. `Pin` was drawn,
looked next to `PushPin`, and was withdrawn for the same reason.

Path data is restricted to the moveto, lineto, `H`, `V`, arc and closepath commands and their
relative forms. That is a consequence of how the set is checked rather than of either library's
drawing style: `src/icons/icons.test.tsx` bounds-checks each glyph by parsing its own `d`,
because jsdom implements neither `getBBox` nor canvas, and a parser that only has a handful of
commands to understand is one that can be read. A cubic may appear, but nothing relative may
follow it in the same subpath, because the parser reads `C`/`S`/`Q` as bare point lists without
advancing the current point; the drawn-out curves in the set are arcs, which advance correctly.

## Versions

Read from `../referenceUILibraries/package.json` and the installed `package.json` before citing a
number; both use caret ranges and float on reinstall. At the time of writing: library A 9.4.0,
library B 2.27.2.
