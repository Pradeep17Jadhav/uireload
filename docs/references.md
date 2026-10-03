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

## Versions

Read from `../referenceUILibraries/package.json` and the installed `package.json` before citing a
number; both use caret ranges and float on reinstall. At the time of writing: library A 9.4.0,
library B 2.27.2.
