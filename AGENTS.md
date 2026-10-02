# AGENTS.md

Instructions for AI agents working in this repository.

Read this file before writing code. It describes how to build a component here, and
one rule that overrides everything else: **every component must be designed against
two real reference libraries, not against memory.**

---

## 1. The rule: always consult both reference libraries

`../referenceUILibraries` holds read-only installs of the two libraries UIReload is
built to line up with:

| Library       | Packages                                                  | Installed |
| ------------- | --------------------------------------------------------- | --------- |
| MUI           | `@mui/material`, `@mui/icons-material`, `@emotion/*`      | 9.4.0     |
| SAP Fiori UI5 | `@ui5/webcomponents`, `@ui5/webcomponents-fiori`, `-base` | 2.27.2    |

Versions float on reinstall (caret ranges), so **always read the version from
`../referenceUILibraries/package.json` and from the installed `package.json` before
citing a number.** The authoritative copy of this guidance, including the read-only
rules, is `../referenceUILibraries/AGENTS.md`.

### When this rule applies

It applies to **every** new component and to every change to an existing component's
props, behaviour, keyboard handling, slots, or ARIA contract:

- Choosing the prop surface and its names.
- Deciding which states exist (`size`, `variant`, `loading`, ...) and their values.
- The keyboard contract, focus management, and the WAI-ARIA APG pattern.
- Slots / sub-components, and the DOM structure of each part.
- Default values, especially the non-obvious ones.

It does **not** apply to: refactors that do not touch the public surface, doc typos,
or `src/internal` changes that no component observes.

### Why two libraries, and why both

The two are genuinely different, and the difference is the point:

- **MUI** is React, prop-driven, theme-driven, heavily composed. It shows how a
  mature React library decomposes a component's API: own props vs. inherited, how
  variants are typed, how overrides work.
- **UI5** is Web Components, attribute-driven, token-driven, enterprise-oriented. Its
  `.d.ts` files carry far richer **JSDoc** than MUI's, and enumerate **styleable
  parts** (`@csspart`) and **events** explicitly. It is the better source for "what
  must this expose, and what does it do".

Use both: take the API decomposition from MUI, the documented behaviour, parts and
event vocabulary from UI5, and reconcile both against UIReload's own rules in
`src/components/README.md` and `docs/accessibility.md`. Where they disagree, the
**WAI-ARIA APG pattern wins**, then UIReload's conventions, then MUI's ergonomics,
then UI5's enterprise details.

### Never guess an API

Do not write a prop name, enum value, event name, or CSS part from memory. Confirm
it in the installed `.d.ts`. If a prop you want does not exist in either library,
that is a finding, not a problem: record it in the component's `README.md` and
implement it only if it serves the APG pattern.

---

## 2. How to look things up

Never read docs blindly. Navigate the installed packages.

### Base paths

```text
../referenceUILibraries/node_modules/@mui/material/
../referenceUILibraries/node_modules/@ui5/webcomponents/dist/
../referenceUILibraries/node_modules/@ui5/webcomponents-fiori/dist/
```

### MUI

| Need                  | Path                                                                           |
| --------------------- | ------------------------------------------------------------------------------ |
| Full component list   | `../referenceUILibraries/node_modules/@mui/material/index.d.ts`                |
| Props for a component | `../referenceUILibraries/node_modules/@mui/material/<Name>/<Name>.d.ts`        |
| Prop unions / enums   | the prop's union type in that same `.d.ts`                                     |
| Behaviour and slots   | `../referenceUILibraries/node_modules/@mui/material/<Name>/<Name>.js`          |
| Class-name contract   | `../referenceUILibraries/node_modules/@mui/material/<Name>/<name>Classes.d.ts` |
| Styling hooks         | `../referenceUILibraries/node_modules/@mui/material/styles/`                   |

MUI folders are `PascalCase` and contain `index.d.ts`, `<Name>.d.ts`, `<Name>.js`,
`<name>Classes.d.ts`, and `.d.mts` / `.mjs` twins. Read the `.d.ts` and `.js`, not
the `.d.mts`.

### Fiori UI5

| Need                      | Path                                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full tag list             | list `../referenceUILibraries/node_modules/@ui5/webcomponents/dist/` and `.../webcomponents-fiori/dist/` — the filenames _are_ the tag list. There is no `dist/index.d.ts`. |
| Props, JSDoc, `@csspart`  | `../referenceUILibraries/node_modules/@ui5/webcomponents/dist/<TagName>.d.ts` (tag `ui5-button` → `Button.d.ts`)                                                            |
| Fiori-only tags           | `../referenceUILibraries/node_modules/@ui5/webcomponents-fiori/dist/<TagName>.d.ts` (e.g. `ShellBar.d.ts`)                                                                  |
| Enum values               | `../referenceUILibraries/node_modules/@ui5/webcomponents/dist/types/<PropName>.d.ts` (e.g. `types/ButtonDesign.d.ts`)                                                       |
| Machine-readable metadata | `../referenceUILibraries/node_modules/@ui5/webcomponents/dist/web-types.json` and `.../dist/custom-elements.json`                                                           |
| CSS custom properties     | `--sap-*` variables; `@csspart` names in the `.d.ts`                                                                                                                        |

Notes:

- UI5 components are Custom Elements, so you set **attributes**, not React props:
  `<ui5-button design="Emphasized" icon="add">`, `disabled=""`. Enums use the exact
  casing from the `.d.ts` (`design="Emphasized"`, not `"emphasized"`).
- UI5 events are `ui5-<component>-<something>` (e.g. `ui5-item-click`).
- A `*Template` class usually pairs with each tag (e.g. `CardTemplate`); it is the
  render template, not something to use directly.
- Do not edit anything under `node_modules/`. They are read-only references.

### Worked example: designing a Button

1. **MUI props** — `../referenceUILibraries/node_modules/@mui/material/Button/Button.d.ts`
   shows `ButtonOwnProps`: `color`, `variant`, `size`, `fullWidth`, `loading`,
   `loadingIndicator`, `startIcon`, `endIcon`, `href`, `disableElevation`,
   `disableFocusRipple`, plus `OverridableComponent` (so `component` decides the
   rendered element). That is the **API decomposition** reference.
2. **UI5 behaviour, parts, events** — `.../@ui5/webcomponents/dist/Button.d.ts` shows
   `design: \`${ButtonDesign}\``, `disabled`, `icon`and`type`; the styleable parts
`@csspart button`, `@csspart icon`and`@csspart endIcon`; and the `click`and`active-state-change`events. That is the **exposed surface and behaviour**
reference.`.../webcomponents/dist/types/ButtonDesign.d.ts` holds the legal designs.
3. **Reconcile** against `src/components/README.md`: keep only what the APG button
   pattern and UIReload's conventions need, rename to UIReload's own token vocabulary,
   render state as `data-*`, drop theme-driven props, and skip Material-isms like
   ripples and elevation.
4. **Cite** in the component `README.md`: which file and symbol backed each
   non-obvious choice.

---

## 3. Finding the counterpart component in each library

Most UIReload components have a close analogue in both libraries. Read the analogue
before designing. These are the usual starting points (verify the exact filename
before relying on it):

| UIReload component  | MUI                          | Fiori UI5                                      |
| ------------------- | ---------------------------- | ---------------------------------------------- |
| `button`            | `material/Button`            | `webcomponents/dist/Button.d.ts`               |
| `icon-button`       | `material/IconButton`        | `webcomponents/dist/Button.d.ts` (`icon`)      |
| `dialog`            | `material/Dialog`            | `webcomponents/dist/Dialog.d.ts`               |
| `select`            | `material/Select`            | `webcomponents/dist/Select.d.ts`               |
| `text-input`        | `material/TextField`         | `webcomponents/dist/Input.d.ts`                |
| `checkbox`          | `material/Checkbox`          | `webcomponents/dist/CheckBox.d.ts`             |
| `radio-group`       | `material/RadioGroup`        | `webcomponents/dist/RadioButton.d.ts`          |
| `switch`            | `material/Switch`            | `webcomponents/dist/Switch.d.ts`               |
| `slider`            | `material/Slider`            | `webcomponents/dist/Slider.d.ts`               |
| `card`              | `material/Card`              | `webcomponents/dist/Card.d.ts`                 |
| `accordion`         | `material/Accordion`         | `webcomponents/dist/Panel.d.ts`                |
| `tabs`              | `material/Tabs`              | search `dist/` for `*Tab*.d.ts`                |
| `popover` / `menu`  | `material/Popover`, `Menu`   | `webcomponents/dist/Popover.d.ts`, `Menu.d.ts` |
| `tooltip`           | `material/Tooltip`           | `webcomponents/dist/Tooltip.d.ts`              |
| `progress`          | `material/LinearProgress`    | `webcomponents/dist/ProgressIndicator.d.ts`    |
| `alert` / `banner`  | `material/Alert`             | `webcomponents/dist/MessageStrip.d.ts`         |
| `text`              | `material/Typography`        | `webcomponents/dist/Title.d.ts`                |
| `icon`              | `material/SvgIcon`           | `webcomponents/dist/Icon.d.ts`                 |
| `shell` / `app-bar` | `material/AppBar`, `Toolbar` | `webcomponents-fiori/dist/ShellBar.d.ts`       |
| `nav`               | `material/Drawer`            | `webcomponents-fiori/dist/SideNavigation.d.ts` |

If a component is not listed, find it in `@mui/material/index.d.ts` and by listing
the UI5 `dist` folders. Most MUI components are `PascalCase` folders named after the
component; most UI5 tags are `PascalCase` `.d.ts` files.

**Cite the file and symbol you actually read.** When a choice is non-obvious, note
the path so it can be reviewed later (e.g. "enum values from
`@ui5/webcomponents/dist/types/ButtonDesign.d.ts`").

---

## 4. What to take from them, and what to reject

UIReload is not a Material clone and not a Fiori clone. Borrow the **API thinking**
and the **documented behaviour**; reject the **implementation machinery**.

### Take

- The prop surface and its **decomposition**: own props vs. inherited vs. native DOM
  attributes.
- Typed enums, their allowed values, and their default values, including the
  reasoning behind a non-obvious default.
- The **keyboard contract** and the focus-management strategy for the widget.
- The set of **events** a component should surface, and their names.
- The **slots / sub-components** a component needs to be usable.
- Documented edge cases and platform behaviour.

### Reject

These are deliberate architectural decisions here, not oversights:

| Reject                                                          | Why (source of truth)                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `sx` prop, `styled()`, Emotion, CSS-in-JS                       | `docs/roadmap.md` — consumer-owned theming, zero runtime CSS-in-JS             |
| Theme provider or context                                       | `docs/roadmap.md` — theming is CSS custom properties                           |
| `color` / `variant` as a theme-key string union                 | There is no provider and no palette to key into; use `data-*` + our own tokens |
| Ripples, elevation, Material motion                             | The surface is a plain CSS custom-property contract                            |
| `--sap-*` or `--mui-*` custom property names                    | Our tokens are `--uir-*`; see `src/theme/tokens.css`                           |
| MUI `classes` / `components` override objects                   | State is expressed as `data-*`; see `src/components/README.md`                 |
| Any added runtime dependency                                    | `tests/package-structure.test.ts` fails the build                              |
| Nesting a UI5 Custom Element inside MUI layout expecting layout | Two different rendering models; keep them in separate layers                   |

The mapping between the two paradigms, one line each:

- MUI **props** -> UIReload **props**, minus the theme-driven ones.
- MUI **classes** / UI5 **`@csspart`** -> UIReload **`data-*` attributes** on
  `uir-<component>` classes.
- MUI **theme** / UI5 **`--sap-*` tokens** -> UIReload **`--uir-*` tokens** in
  `src/theme/tokens.css`.
- MUI **`sx`** / UI5 **inline styles** -> UIReload **`className` + `style` on the
  root only**; there is no `sx`.
- MUI **event handlers** / UI5 **Custom Events** -> UIReload **React handler props**,
  composed with `composeHandlers` so the consumer runs first and can
  `preventDefault()` to opt out.

---

## 5. The order of work for a new component

Do these in order. The reference step comes first on purpose: it is cheaper to
discard a design you have not written down yet.

1. **Identify the APG pattern.** The WAI-ARIA APG is the specification, not a
   suggestion. Note the required role, states, properties, and keyboard behaviour.
2. **Read the MUI counterpart.** Note the prop surface, its decomposition, the
   variants and their defaults, and the slots.
3. **Read the UI5 counterpart.** Note the documented behaviour, the `@csspart` list,
   the event names, the enum values, and the accessibility notes.
4. **Write down the reconciled design** — props, states, keyboard table, slots,
   defaults — and mark anything neither library covered.
5. **Copy the template** and implement:

   ```bash
   cp -r src/components/_template src/components/thing
   # rename every `example` occurrence to `thing`
   npm run sync:exports
   npm run verify
   ```

6. **Document** props, the keyboard support, and the CSS contract in the component
   `README.md`, including the reference citations from steps 2 and 3.

The full authoring rules are in `src/components/README.md`; the enforcement matrix
is in `CONTRIBUTING.md`.

## 6. Definition of done

The standard list from `CONTRIBUTING.md`, all enforced in CI:

1. `npm run verify` passes (format, lint, CSS lint, typecheck, build, tests, size
   budget, package audit).
2. `npm run sync:exports` has been run and its output committed.
3. Tests cover rendering, keyboard interaction, controlled and uncontrolled state,
   and `dir="rtl"`.
4. Storybook stories cover each state that matters, including dark and
   high-contrast.
5. `README.md` documents props, keyboard support, and the CSS contract.
6. No new runtime dependency.
7. `axe` reports zero violations.
8. The stylesheet is wrapped in `@layer uireload.components` and contains no physical
   direction properties.

Additionally, because of the rule in section 1:

9. The component's provenance is recorded in **`docs/references.md`**, not in
   the component's `README.md` or in any source comment. `docs/references.md`
   names the counterpart component consulted in **each** reference library and
   cites the file and symbol behind each non-obvious API choice.

10. **Nothing published may name a reference library.** `dist/**`, `README.md`,
    `CHANGELOG.md` and every source comment reachable from them — including the
    JSDoc that becomes the published `.d.ts`, the CSS that becomes
    `dist/index.css`, and the `sourcesContent` of every published source map —
    must be free of `MUI`, `UI5`, `Fiori`, `@mui/*`, `@ui5/*` and
    `referenceUILibraries`.

    A comment explains **why**, stated in terms of the widget, the ARIA pattern,
    WCAG or platform behaviour: "every hover rule here is gated on
    `pointer: fine`", not "the reference library gates `:hover` the same way".
    Attribution moves to `docs/references.md`; the reasoning stays and is
    de-attributed, never deleted. `tests/published-content.test.ts` enforces it.

---

## 7. Rules for agents

1. **Verify before you write.** Confirm a prop, enum, event, or part exists in the
   installed `.d.ts` before you use it. Never invent an API from memory.
2. **Prefer the typed definition over the docs.** The installed version is
   authoritative; online documentation may describe a different major version.
3. **Read both libraries.** One is not enough, and neither is a substitute for
   reading. The two disagree in useful ways.
4. **Do not edit anything under `node_modules/`** in either project. They are
   read-only references.
5. **Cite the file you used** whenever a choice is non-obvious.
6. **Do not mix paradigms.** A MUI React component and a UI5 Custom Element are
   different rendering models; keep them in clearly separated layers rather than
   nesting one inside the other.
7. **Record gaps.** If something is needed that neither library provides, note it in
   the component's `README.md` instead of working around it silently.
8. **Respect this repository's architecture over both references.** The libraries
   inform the API; the conventions in `src/components/README.md`,
   `docs/accessibility.md` and `docs/architecture.md` decide the implementation.
