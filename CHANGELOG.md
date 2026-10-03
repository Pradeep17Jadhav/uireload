# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **An icon set: 449 vector glyphs, one module each.** Imported by name, so an
  application that uses four icons ships four icons.

  ```ts
  import AddFilled from "uireload/icons/AddFilled";
  import AddOutlined from "uireload/icons/AddOutlined";
  ```

  - **Naming.** Every icon is `PascalCase`, because the module name *is* the
    identifier written at the call site. A base name is always either `Filled`
    **and** `Outlined`, or bare — never a lone variant, and never a bare form
    *and* a pair. Sixty-three icons have only one honest form and carry no postfix
    at all; the full list is in [`src/icons/README.md`](./src/icons/README.md), and it
    runs longer than it looks because a *mark* — an arrow, a transport control, a text
    alignment, a slashed thing — has no solid form that is better than the mark.
  - **No aliases.** A name that already ships under another name is not added
    again: `Build` is the cog, `Automatic` is the refresh, `Create` is the
    pencil, `Approve` is the disc-and-tick, `Cancel` is the ring-and-cross,
    `Checklist` is the rows, `FullScreen` is the arrows. A second glyph that
    differs only by name is a second answer to a question that already has one.
    `Expand` and `Collapse` were drawn twice and dropped twice: the four-arrow
    form is `FullScreen`, and at 20px an arrow leaving a box and an arrow
    entering one are the same eight pixels.
  - **The two variants mean two different things, deliberately.** A shape with a
    solid form is filled, with the detail knocked out by `fill-rule`. A *mark* —
    a paperclip, an arrow, a Bluetooth rune, a currency sign — has no solid form
    that is better than the mark itself, so its `Filled` variant is the same
    construction at a heavier weight. One weight per family, everywhere: an
    outline that is 2 in one icon and 1.5 in the next reads as two sets rather
    than two weights.
  - **Sizing is `em` by default**, so an icon beside text is the size of that text
    at every step in the type scale — the most common way an icon set looks
    wrong. `size="sm" | "md" | "lg"` resolves the shared `--uir-icon-size-*`
    tokens through a `data-*` hook, and any other string is applied as a CSS
    length for icons outside a control.
  - **Decorative by default.** With no `title`, an icon is `aria-hidden` and out
    of the accessibility tree entirely, which is correct beside a visible label.
    Supplying `title` makes it `role="img"` with a `<title>`, for the case where
    the icon is the only content of a control. The two halves are set together
    and cannot be set apart on purpose: `role="img"` with no name is worse than
    either alternative.
  - **Vector throughout, on one 24 unit grid.** No raster, no font glyph, no
    external reference. The geometry is original, and the grid is what makes 449
    separate files look like one set — so the test suite asserts it for every one
    of them, including that each glyph stays inside its own viewport.
  - **Path data stays inside a grammar the test suite can read.** The bounds
    check parses each glyph's own path data — jsdom has neither `getBBox` nor
    canvas — so the vocabulary is the moveto, lineto, `H`, `V`, arc and closepath
    commands, and anything wider has to justify itself. A cubic may appear, but
    nothing relative may follow it in the same subpath, because the parser reads
    `C`/`S`/`Q` as bare point lists. An arc advances correctly, which is why the
    drawn-out curves in this set are arcs.
  - **One module per icon, not a registry.** `uireload/icons/*` is the single
    pattern subpath in the export map; the reason, and why components do not get
    one, is written up in `scripts/build-exports.mjs`.
  - Documented in [`src/icons/README.md`](./src/icons/README.md), with a
    Storybook gallery that renders the whole shelf at every size and in both
    colour schemes.
- **129 more icons: the ones a page actually reaches for.** `Home`, `Menu`,
  `MoreVert`, `MoreHoriz`, the four `Chevron`s, `Dashboard`, `Logout`, `Delete`,
  `Save`, `Download`, `Upload`, `Share`, `Print`, `Link`, `ExternalLink`,
  `Filter`, `Sort`, `Send`, `Flag`, `Search`, `ZoomIn`, `ZoomOut`, `Unlock`,
  `Key`, `Visibility`, `VisibilityOff`, `Folder`, `File`, `Note`, `Tag`,
  `Bookmark`, `Drafts`, `Archive`, `Layers`, `Table`, `Barcode`, `QrCode`,
  `TextFormat`, `Cart`, `Wallet`, `Gift`, `Info`, `Help`, `Warning`, `Verified`,
  `Hourglass`, `Timer`, `Location`, `Language`, `Block`, `Play`, `Pause`,
  `Stop`, `Volume`, `Mute`, `Mic`, `Video`, `Music`, `Person`, `Users`,
  `PersonAdd`, `Star`, `Favorite`, `Power`, `Wifi`. 56 shapes ship as a
  `Filled`/`Outlined` pair and 17 as one bare module, taking the set from 156
  glyphs to 285.
- **100 more icons: the ones still missing after two rounds.** Chosen by how often a
  page reaches for them rather than by what is easy to draw, so the conspicuous gaps
  went first. `Mail` was the most glaring absence in the whole set. `Settings` and
  `Notifications` are the two most-used glyphs in any interface and neither was
  present. Also `CheckBox`, `ConfirmationNumber`, `Fingerprint`, `Shield`,
  `Password`, `VerifiedUser`, `Apps`, `Devices`, `SdCard`, `Usb`, `Route`,
  `Database`, `Dns`, `Lan`, `Webhook`, `Schema`, `BugReport`, `Headphones`,
  `Movie`, `ShoppingBag`, `Storefront`, `LocalOffer`, `Receipt`, `CardGiftcard`,
  `Article`, `MenuBook`, `AutoStories`, `EmojiEmotions`, `SportsSoccer`, `Quiz`,
  `FactCheck`, `Event`, `Explore`, `Map`, `Hotel`, `Restaurant`,
  `DirectionsBus`, `Terminal`, `DataObject`, `DataArray`, `CodeOff`, `LinkOff`,
  `PushPin`, `SkipNext`, `SkipPrevious`, `FastForward`, `FastRewind`, `Reply`,
  `ReplyAll`, `Forward`, `SwapHoriz`, `SwapVert`, `CompareArrows`, `FirstPage`,
  `LastPage`, `MoreTime`, `FormatQuote`, `FormatAlignLeft`, `FormatAlignCenter`,
  `FormatAlignRight`, `FormatListNumbered`, `Translate`, `TrendingUp`, `ThumbUp`,
  `ThumbDown`, `AddCircle`, `RemoveCircle`, `Remove`, `RadioButtonChecked`,
  `ToggleOn`, `ToggleOff`, `RssFeed`, `BatterySaver`, `ScreenShare`, `Vibration`,
  `Airplanemode`, `DoNotDisturb`, `Restore`, `CloudDone`, `CloudOff`, `CloudSync`,
  `CloudDownload`, `Contacts`, `Voicemail`, `AlternateEmail`, `Badge`, `Groups`,
  `SupervisorAccount`, `SupportAgent`, `FilterAlt`, `FilterDrama`, `TextFields`,
  `Spellcheck`. 64 shapes ship as a `Filled`/`Outlined` pair and 36 as one bare
  module, taking the set from 285 to 449.
  - **`Build` is a wrench now, not a cog.** `Settings` needs the gear, and a cog
    named `Build` was never what the name meant — it is the one icon in the set
    whose *label* was wrong rather than its drawing. Two cogs in one set is one cog
    too many.
  - **Names that would have been a second answer were cut, not drawn.** `Sms`
    because `ChatBubble` is already a bubble with lines; `NavigateBefore` /
    `NavigateNext` because they are `SkipPrevious` / `SkipNext` stood up;
    `Description` because it is `Note`; `Percent` because it is the inside of
    `LocalOffer`; `Replay` because it is `Automatic`; `Clear` because it is a second
    `Cancel`; `Pending`, `Brightness`, `Storage` and `Inventory` against
    `Timer`, `Sun`, `Database` and `Dns`; `Hub` against `Lan`; and `Forum`,
    because the set already had three speech bubbles and a fourth is not a fourth
    idea. `Refresh`, `Success`, `Error`, `Task`, `Edit`, `Expand` and `Collapse`
    remain declined for the reasons given above.
- **48 of the original icons redrawn** (91 modules). The first 156 had been
  proof-sheeted but never actually looked at, and a review found five distinct kinds
  of failure. Each is now a rule rather than a one-off fix:
  - **Wrong, not ugly** — a solid form that said something else.
    `CalendarMonth` and `CalendarToday` were black rectangles whose day cells were
    the only thing separating them from a black rectangle. `CreditCard` was a slab
    with a one-pixel stripe. `CreateNew` was a black square with a white dot where
    the `+` should be. `Cookie` had a third of itself bitten out of its forehead.
    `BarChart` was four bars of near-identical height — a barcode, and `Barcode`
    already exists.
  - **Illegible** — `Attachment` read as an oval, `Cast` as scratches, `Bed` as a
    flag on a pole, `Bug` as a table lamp, `Cake` as a chart with a rind, `System`
    as a monitor with an unexplained disc inside it.
  - **Asymmetric** — `Add`, the most-used glyph in any interface, had an
    off-centre cross with unequal arms. `Contrast` split at an angle, so a
    half-black circle read as a crescent. `Contactless` had its fan on one side
    only. `UploadCloud` cut its arrow out of the top-left corner.
  - **Inconsistent family** — the four `Arrow*` were four different arrows and are
    now one construction rotated four ways. `BlurOn` was a droplet while `BlurOff`
    was a slashed circle, which is half a pair. `CropFree` was the same four
    corner brackets as `FullScreen`. `Chat` read as a flag. Five `Currency*`
    glyphs each wore a circle, which turned five different problems into one.
  - **Over-heavy** — `FullScreen`'s filled form was four disconnected blobs;
    `PasteContent` and `CopyContent` were single solid squares that said "one
    sheet" instead of "two".
- **`Divider`, `Skeleton`, `Avatar`, `Alert`.** Four components with no shared theme
  beyond the token contract.
  - **`Divider`** renders identically whether or not it is in the accessibility
    tree, so `decorative` is an explicit prop: `role="presentation"` rather than
    `aria-hidden`, which does not stop an announcement when focus lands inside. A
    string `label` is written to `aria-label` too, because `role="separator"` is a
    **structure** role and structure roles are not named from their contents — the
    text inside the rule looks like its name and is not one.
  - **`Skeleton`** announces almost nothing: a `role="status"` region named
    `"Loading"`, and every bar `aria-hidden`. A screen reader describing four grey
    rectangles has told the user nothing, and reading it four times delays the
    announcement that matters. `lines={0}` renders one bar rather than nothing,
    because an empty placeholder is the layout shift the component exists to
    prevent.
  - **`Avatar`** falls back to its initials when the image fails — a revoked avatar
    URL is normal, not exceptional, and a broken-image glyph is worse than letters.
    The image and the initials are alternatives, never both: rendering both
    announces "Ada Lovelace, AL". `initialsFrom` is exported so a consumer derives
    them the same way, and the component takes `initials` rather than a `name`
    because splitting a display name is a guess it would get wrong for every name
    that is not "First Last".
  - **`Alert`** derives both `role` and `aria-live` from `tone`, so `tone="danger"`
    becomes `role="alert"` without a second prop — the one tone that means "this
    will cost you" is the only one that justifies interrupting a screen reader.
    Both remain overridable, and a contradictory pair warns in development. The
    alert never dismisses itself: `onDismiss` reports and stays.
- **`Tooltip`.** A focusable `<span>` trigger, portalled and positioned by the
  shared overlay algorithm. `delay={400}` on hover and **no delay on focus**,
  because a keyboard user has arrived deliberately and there is no
  accidentally-passed-over case to guard against; `hideDelay={200}` so moving the
  pointer onto the tooltip to read it does not dismiss it. `describe` chooses
  between `aria-describedby` and `aria-label`, because a description supplements a
  name and cannot replace a missing one — the difference between an icon button
  that is announced and one that is not. The surface is always in the DOM and
  `hidden` when closed, since a description that appears with its element is never
  observed.
- **`Drawer`.** `modal` defaults to **`false`**, which is the component's most
  consequential decision: modal is a focus trap and a scroll lock, and a
  navigation drawer that traps focus is worse than one that does not, because the
  user cannot reach the item they opened it to change. A non-modal drawer still
  takes focus on open — otherwise `Tab` never gets inside and the drawer is
  unreachable — and does not trap. `placement` is logical, not `left` / `right`.
  `onClose(reason)` is the request and `onDismiss(reason)` is the fact, matching
  `Dialog`, `Popover` and `Snackbar`.
- **`Pagination`.** A named `<nav>` of real buttons. `aria-current="page"`, never
  `aria-pressed`: the current page is a position, not a toggle. First and last are
  always one click away, the gaps are `aria-hidden` because announcing "ellipsis"
  announces a piece of CSS, and a `role="status"` region announces "Page 3 of 12"
  — which is the part neither reference API has, and the fix for a screen reader
  user pressing a page number and being told nothing.
- **`Stepper`.** `linear` by default, and the default decides which steps exist as
  **buttons**: the steps behind the current one are activatable, because a wizard
  you cannot go back in is a wizard people abandon, and the steps ahead are plain
  text. Unreachable steps are `<div>`s rather than disabled buttons — a disabled
  control is announced as "unavailable", which also claims it is a control. The
  current step's header is therefore never a button, so `aria-current="step"` is
  written to whichever element the step is; putting it on the button alone would
  make the one thing the component communicates vanish in its default mode.
  `errorText` is `aria-describedby`-ed onto the header, with per-instance ids so two
  steppers on a page cannot announce each other's failures.

### Changed

- `BASE_MESSAGES` gains `common.page`, `common.previousPage`, `common.nextPage`,
  `common.firstPage`, `common.lastPage`, `common.step` and `common.of` (the last
  with a `{total}` placeholder, so "Page 3 of 12" is not concatenated — the word
  order is the translator's to choose).
- **An icon imports `cx` from `../internal/classnames`, not from the barrel.** The
  barrel is right for components, which need most of it. An icon needs one
  twenty-line function, and going through the barrel dragged the focus trap, the
  overlay positioning maths and the scroll lock into every icon's chunk — 15.6 kB a
  consumer of a single glyph never runs. An icon now pulls three small chunks
  instead.
- **`./icons/*` is the one pattern subpath in the export map**, with an explicit
  `typesVersions` line per icon because that map cannot pattern its own target.
  The "no wildcard subpath" rule is now scoped to `./components/*`, which is where
  it was actually about explicit per-component entries; the rationale is in
  `scripts/build-exports.mjs`.
- **The aggregate `icons/*` size budget goes from 120 to 320 kB gzipped**, which is
  the cost of the whole catalogue: 449 icons at 305 kB. It is a growth tripwire
  rather than a download size — an application imports the four glyphs its page
  uses — so the ceiling sits just above the current figure instead of being
  removed, and the per-icon 1 kB budget still runs on all 449. The per-glyph cost
  is what justifies the raise and it has not moved: 344 bytes per module at 285
  icons, 347 at 449. Two hundred and eighty-nine more glyphs cost what the last
  hundred and twenty-nine did, which is what says path data is not accumulating.

### Fixed

- **An icon could render as nothing at all.** `StarFilled` shipped as
  `12 1.8L14.59 8.44…Z` — a coordinate pair with no command in front of it, which
  is not a path. The bounds parser read the bare pair as two no-op tokens, carried
  on from the first real command and reported a perfectly plausible box, so the
  suite passed a glyph that drew nothing. Every path is now asserted to open with a
  moveto.
- **A zero-radius arc silently truncated a path.** `A0 0 0 0` is specified to
  degrade to a line; Chrome drops the rest of the path instead. Five filled icons
  were solid black rectangles with their knockouts missing, because the knockout
  that should have cut the detail out was the thing that broke it.
- **Knockouts stopped cutting when a shape followed a `Z`.** A relative `m` after
  `Z` is measured from where that subpath *began*, not where it ended, which threw
  `VerifiedFilled`'s tick half a unit off the viewport and `SendOutlined`'s fold
  eight units out of it.
- **`M7.1 11.9 3.2 3.3` is a line, not a relative move.** The second coordinate
  pair after a `moveto` is an implicit `lineto`, which put `Checked`'s tick in the
  wrong place entirely.
- **`tests/published-package.test.ts` failed as a timeout** rather than as a
  failure. It spawned one `node` process per component per module format; resolving
  every built component and every built icon in one process per format brings the
  component check from 11.4s (timed out) to 420ms, and still names each failure.
- **A base name could be a bare form *and* a pair.** `BlurOff` existed as
  `BlurOff`, `BlurOffFilled` and `BlurOffOutlined` at once: three modules for one
  glyph, and a breaking change to a published specifier. Nothing asserted the
  union — the existing check reads "lone variant" and "both variants", and all
  three at once satisfies both — so `tests/package-structure.test.ts` now rejects
  the mixture.
- **A filled icon could lose its detail without failing anything.** `filledIcon`
  paints `fill: currentColor` with `stroke: none`, so a filled variant whose detail
  is a *stroke* paints that detail in the same ink as the shape it sits on, and it
  disappears. `DoNotDisturbFilled` was a plain black disc, `ExploreFilled` had no
  needle, `LocalOfferFilled` had a bare tag, `BatterySaverFilled` had no leaf,
  `EmojiEmotionsFilled` had no mouth, `HotelFilled` had no headboard,
  `LanFilled` had no link, `ScreenShareFilled` had no arrow, `TextFieldsFilled`
  had no stem, `VerifiedUserFilled` had no person, `StorefrontFilled` had no shop
  and `AttachMoneyFilled` had no currency sign. Every one passed the bounds check,
  because the glyph was perfectly in bounds — it was just missing. Detail inside a
  filled icon is now a knockout in the same `fillRule="evenodd"` path as its shape.
- **Two knockouts in one shape painted their overlap back in.** Where two knockout
  regions cross, the count reaches three and `evenodd` fills it, so `AddCircleFilled`
  grew a diamond instead of a plus. A plus is now drawn as one closed outline, and
  knockout regions are kept disjoint; `Fingerprint`, `FormatListNumbered` and
  `OfflineBolt` became single modules instead, because neither admits an honest
  solid form.
- **A glyph could be geometrically fine and still wrong.** `Badge` was two
  overlapping circles, one of which bulged 4.4 units off the grid; `RssFeed`'s
  arcs swept *below* the dot instead of above it; `FilterDrama`'s hill bulged
  sideways; `SupervisorAccount`'s ring ran off the left edge; `EmojiEmotions`'s
  mouth was a crescent down the right-hand side. Each is one wrong angle or one
  wrong sign, and the test suite passes all of them, because a mirrored or
  rotated glyph is still inside its own viewport.
- **A cubic left the bounds parser measuring from the wrong point.** `C`, `S` and
  `Q` are read as bare point lists without advancing the current point, so a
  relative command after one is measured from the subpath's start.
  `DatabaseFilled` reported a left bound of −4 while drawing nothing left of `x=4`.
  Every curve drawn out that way is now an arc, which advances correctly.
- **A wide flat arc reported a bound far wider than it draws.** The parser models
  every arc as a circle of radius `max(rx, ry)`, so `A8 3.4` claimed a bottom of 26
  on a 24 unit grid. `Database`'s lid is now four circular arcs, which measure
  themselves exactly.
- **`Redeem` and `CompareArrows` said something else.** `Redeem` was a gift box
  with a bar, which reads as a blob; it is a voucher with an arrow going into it.
  `CompareArrows`' two arrows overlapped into a single shape; they are now
  side by side.

## [0.3.0] - 2026-10-02

### Added

- **`Textbox`, `Select`, `Switch`, `Popover`, `Dialog`.** Five components, completing
  the form-control and overlay set. Every one renders the platform's control where
  one exists — a real `<input type="radio">` per radio option, a real
  `<input type="range">` per slider thumb, a real `<label for>` — so role, name,
  state, form participation and keyboard behaviour are reimplemented nowhere.
- **`Checkbox`, `RadioGroup`.** The remaining two binary and single-choice controls.
  Both draw their box and dot in CSS over a transparent input that covers the whole
  row, so there is one focusable element rather than a focusable box and a clickable
  label that have to be kept in agreement. `RadioGroup` takes an `options` array
  rather than children: a children-based group has to read each child's props to
  find its value, which silently misbehaves the moment a child is wrapped in a
  component or a fragment.
- **`Slider`.** One thumb or a range, from `value` length rather than a separate
  `thumbs` prop, because a second source of truth for one fact is a prop every
  consumer has to keep in step. Arrows, `Home` and `End` are left to the platform
  — handling them here as well would move the thumb twice per press — and the
  component adds only what a native range input lacks: `PageUp`/`PageDown`, `+`/`-`
  and `Escape`, plus the neighbour clamp that stops two thumbs crossing, since a
  range whose minimum is above its maximum renders fine and lies to everyone who
  submits it.
- **`Chip`.** Three `intent` states rather than two booleans. A chip that is both
  activatable and removable has two tab stops and two accessible names, which is
  why the third state exists rather than a `clickable` flag alongside a
  `deletable` one. `onRemove` reports and the chip stays — the list is the
  consumer's state.
- **`Text`.** Body prose and six heading levels. `variant="h2"` renders an `<h2>`:
  the visual size and the document outline are one prop, so they cannot drift
  apart, which is the failure a large-font `<div>` produces and the one a
  screenshot cannot show. `as` is the escape hatch for when the automatic element is
  wrong.
- **`Link`.** A real `<a>`, with `href` optional — an `<a>` with no `href` has no
  link role and no tab stop, which is the honest state for a link a router has not
  resolved, and is why `rel` is warned about rather than defaulted for
  `target="_blank"`.
- **`Tile`.** `interactive` and `href` decide the rendered element, because "the
  whole card is clickable" is a real interaction and a `<div>` with a `tabIndex`
  and a `keydown` handler only gets close to it. `flat` is the default elevation:
  a page of raised cards reads as a page of popups.
- **`TabBar`.** `role="tablist"` over real `<button role="tab">` elements with
  manual activation by default — arrows move focus, `Enter` or `Space` moves
  selection — because arrowing past four tabs under automatic activation fires four
  requests, and on a tab set not wrapped in a router destroys the form data on the
  tab the user left. Panels are hidden rather than unmounted unless `lazy` is set,
  so find-in-page still finds text in a tab you are not looking at.
- **`Snackbar`.** The timer pauses on hover **and** on focus, resuming with the
  time that was left rather than a fresh duration, and the close reason
  (`timeout` / `dismiss` / `escape`) is reported so a consumer can tell a timed-out
  message from a dismissed one. The live region exists from the first render and a
  closed snackbar is `visibility: hidden` rather than unmounted: a region created
  at the same moment as its text is frequently not announced at all.
- **`docs/foundations.md` §6, "Body text and headings".** The type scale,
  specified: heading sizes are literals because a heading scale is a fixed
  relationship between six sizes, while body text reads tokens because it genuinely
  varies by colour scheme.
- `axe` coverage for all ten, in `tests/accessibility.test.tsx`.

### Changed

- `tests/setup.ts` gained two jsdom shims, both documented in place. A range input
  has no keyboard behaviour in jsdom, where every browser steps the value and fires
  `change` — so `Slider`'s keyboard tests could not be written at all. And
  `setSelectionRange` throws for any non-text-entry input, which killed every
  `Home`/`End` test before it reached an assertion.

### Fixed

- **`RadioGroup`'s first arrow press did nothing.** With nothing selected, stepping
  from the selection computes `(-1 + 1) % 3 === 0` and re-selects the option the
  user is already standing on. Arrows step from focus instead.
- **`RadioGroup`'s `clearable` silently did nothing.** A radio that is already
  checked fires no `change` event, so a clear implemented on `change` can never
  empty a group. It is carried by `click`.
- **`Slider` never committed a keyboard change.** `onValueCommit` is now keyed on
  whether a pointer button is down, not on remembering a keypress — the platform
  fires `change` identically for a drag and an arrow press, and a keypress-based
  approach depends on handler ordering that is not guaranteed.
- **`Link` swallowed `target` and `rel`.** Both were destructured for a development
  warning and never re-applied, so the link rendered looking right and opened in
  the same tab whatever the consumer asked for.
- **`Link`'s disabled state left the tab order.** The comment argued that an
  `<a>` without an `href` stays focusable. It does not: the platform gives it no
  tab stop and no link role. The `href` is kept and the navigation stopped with
  `preventDefault`.
- **`TabBar` dropped the badge from its own accessible name.** An `aria-label`
  derived from a plain-text label *replaces* the content, so `textValue` is now the
  only source and a plain-text label derives its name from the platform.
- **`Chip` was shorter than the target-size floor.** It scaled
  `--uir-control-height-sm` by `0.875`; a chip *is* a pointer target when
  activatable, so it now sits on the 24px minimum like every other control.
- **`TabBar` emitted an invalid `aria-controls`.** A tab with no panel pointed at
  an id that did not exist, which `axe` reports as critical. It is now omitted,
  and a consumer rendering their own panel associates it from the tab's `id`.
- `tests/published-package.test.ts` scaled its timeout to the component count. It
  spawns one `node` process per component per module format, and the default 5s was
  enough for nine components and not for fourteen — a failure that read as "your
  package is too slow" about a test simply doing more subprocess work.

### Not implemented

- **A separate `Title` component.** Recorded in `text/README.md` rather than
  answered with a thin alias. `Text` already renders real heading elements whose
  level is their rank, so `Title` would add a name and no behaviour.

## [0.2.0] - 2026-10-02

### Added

- **`docs/references.md`.** The provenance record for every component: which
  file and symbol behind each non-obvious API choice, and which behaviour was
  copied, renamed, narrowed or rejected. Agent-only, and not published.
- `tests/published-content.test.ts`, which fails the build when anything shipped
  names a reference library. It reads `dist/` rather than the source, because a
  source-level check would pass while a stale build still published the old
  comments, and it covers the `sourcesContent` of every source map, which embeds
  the entire original TypeScript.
- `tests/markdown.test.ts`, covering table well-formedness and other structural
  rules a prose file can violate silently.
- `npm run release:patch | release:minor | release:major`. One command per bump
  type: bump the version, release the `[Unreleased]` body under a dated heading,
  run `verify`, commit, tag, and push. The push is what publishes, because npm
  only mints provenance attestations from a supported CI provider.

### Changed

- **Provenance moved out of the shipped code.** Every published `.d.ts`,
  `dist/index.css` comment and source map is now free of third-party library
  names. The reasoning stays and is stated in terms of the widget, the ARIA
  pattern, WCAG or platform behaviour; only the attribution moved to
  `docs/references.md`. Naming another library in a shipped artefact also
  implied a port or compatibility relationship that does not exist.
- `docs/foundations.md` and the component `README.md` files rewritten to match,
  dropping the per-file citation lists that the provenance record now holds.

### Fixed

- **The template's story was published as a real component.** `index.json` listed
  `template-example--*` in the Storybook sidebar, so a screenshot sweep would pick
  up scaffolding. Negated `stories` globs were tried in two forms and neither
  excluded anything, so the template's story file is now
  `example.stories.template.tsx`, which the glob cannot match at all.
- **Comments left dangling by the de-attribution pass.** A line reduced to bare
  punctuation by a row-level replacement; caught by inspection, not by any tool.

## [0.1.0] - 2026-10-02

First release. Infrastructure plus the first four components.

### Added

- **Design foundations.** `docs/foundations.md` plus a `--uir-control-*` token layer and
  `src/foundations.ts`. Sizes, the emphasis ladder, the tone set, the six control
  states, shape, typography and truncation are specified once so components are
  consistent by construction rather than by review.
- **`Button`, `IconButton`, `ToggleButton`, `ToggleButtonGroup`.** The first four
  components.
- `VARIANTS` (`ghost` / `outline` / `solid`) and `TONES`
  (`neutral` / `accent` / `positive` / `danger`) split emphasis from intent, so a
  control never has to invent a `variant="danger"` that quietly means both louder
  and destructive.
- `ToggleButtonGroup` renders `role="radiogroup"` with roving tabindex and
  selection-follows-focus in single mode, and `role="group"` with individually
  tabbable pressed buttons in multiple mode.
- `useRovingFocus` gained `itemSelector` and `onNavigate`, so selection can follow
  focus without the focus helper assuming it.
- axe-core as a dev dependency, with `tests/accessibility.test.tsx` asserting zero
  violations per component in every colour scheme.
- `tests/theme-tokens.test.ts` asserts the dark palette declared for
  `data-uir-scheme` and for `prefers-color-scheme` cannot drift apart.

- Build pipeline: dual ESM/CJS output, per-component entry points, generated type
  declarations, published CSS as a stable artifact.
- Export map with explicit per-component subpaths, generated by
  `scripts/sync-exports.mjs` and verified by `publint` and `attw`.
- Theming contract: CSS custom properties, `light` / `dark` / `high-contrast`
  schemes, density presets, reduced-motion and forced-colors handling.
- i18n contract: namespaced message catalog, placeholder interpolation with literal
  brace escaping, per-key fallback so partial catalogs stay valid.
- Internal primitives: `useControllableState`, `useRovingFocus`, `useFocusTrap`,
  `composeHandlers`, `composeRefs`, `useDirection`, `useMediaQuery`,
  `useIsomorphicLayoutEffect`.
- RTL enforcement: `scripts/check-css.mjs` fails the build on unnamespaced class
  selectors, physical direction properties, and asymmetric `box-shadow` x-offsets.
- Bundle size budgets via `scripts/report-sizes.mjs`.
- Storybook with RTL, color-scheme and density toolbars, and the a11y addon
  configured to fail on violations.
- Testing infrastructure: Vitest, Testing Library, SSR and hydration tests,
  architecture tests covering packaging and CSS conventions.
- Component authoring template at `src/components/_template`.
- CI across Node 20 and 22 on Linux and Windows, plus dependency audit and a
  publish dry run.

### Fixed

- **`ghost` and `outline` labels were invisible** for the `accent`, `positive` and
  `danger` tones. Each tone set one foreground, which is correct for `solid` but painted
  an on-fill colour onto the page background. Tones now supply a role set with separate
  fill and unfilled foregrounds.
- **A neutral `solid` button looked identical to a neutral `outline` button.** It filled
  with `--uir-surface-raised`, which is white in the light scheme. The neutral tone has a
  surface ramp of its own now.
- **`--uir-success` and `--uir-danger` failed WCAG SC 1.4.3** at 3.30:1 and 4.24:1 as
  labels, and `--uir-border-strong` failed SC 1.4.11 at 2.56:1. Both semantic ramps are one
  step darker than a conventional 600/400 scale. `tests/contrast.test.ts` measures every
  tone x variant x scheme pair and fails below the threshold.
- **`selectionMode`, `value`, `defaultValue` and `onValueChange` leaked to the DOM** on
  `ToggleButtonGroup` as `selectionmode="single"` and friends, because they were read as
  `props.x` rather than destructured out of the rest props.
- **A `ToggleButtonGroup` child that is a component or fragment silently collapsed** to a
  single valueless, label-less button. It now logs a development error naming the problem.
- **Storybook rendered composited components unstyled.** Each story imported only its own
  stylesheet, so `ToggleButtonGroup` showed three default grey buttons. The preview now
  imports the assembled `dist/index.css`, which is what a consumer loads.
- **Pinning `data-uir-scheme="light"` on a subtree did nothing**, because the auto-dark
  rule lives on `:root:not([data-uir-scheme])`. The pin is now declared alongside `:root`,
  and `docs/theming.md` states where the attribute has to go.

- The CSS linter could not strip multi-line block comments, because it worked
  line by line. A comment that opened and closed on different lines had its prose
  parsed as CSS. `stripBlockComments` now runs over the whole file with line numbers
  preserved.

### Known limitations

Documented in [`docs/architecture.md`](./docs/architecture.md#known-limitations):
no component-level CSS splitting, heuristic `box-shadow` linting, no automated
screen-reader testing, and coverage thresholds still at their infrastructure-era
values.
