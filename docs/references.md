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

### Foundations - `src/foundations.ts`, `src/theme/tokens.css`, `docs/foundations.md`

| Concern               | Source                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Variant vocabulary    | `@mui/material/Button/Button.d.ts` — `variant`; `@ui5/webcomponents/dist/types/ButtonDesign.d.ts`        |
| Tone vocabulary       | `@mui/material/Button/Button.d.ts` — `color`; `@ui5/webcomponents/dist/types/ButtonDesign.d.ts`          |
| Size tiers            | `@mui/material/Button/Button.d.ts` — `small \| medium \| large`                                          |
| Control metrics       | `@ui5/webcomponents/dist/generated/themes/sap_horizon/parameters-bundle.css.js` — `--_ui5_button_base_*` |
| Focus ring metrics    | `@ui5/webcomponents/dist/css/themes/Button.css` — `--_ui5_button_focused_border`                         |
| Unfilled variant wash | `@ui5/webcomponents/dist/css/themes/Button.css` — `Transparent` design tokens                            |

## Versions

Read from `../referenceUILibraries/package.json` and the installed `package.json` before citing a
number; both use caret ranges and float on reinstall. At the time of writing: library A 9.4.0,
library B 2.27.2.
