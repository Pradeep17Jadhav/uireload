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

### Foundations — `src/foundations.ts`, `src/theme/tokens.css`, `docs/foundations.md`

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
