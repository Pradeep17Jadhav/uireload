/**
 * Select.
 *
 * A listbox in a popover, triggered by a button.
 *
 * Roving focus rather than `aria-activedescendant`, and that is the load-bearing decision here.
 * `aria-activedescendant` keeps DOM focus on the trigger and points at the active option, which
 * sounds simpler — but the options live in a **portal**, so the activedescendant reference crosses
 * a document-position boundary that assistive technology is not required to resolve, and the
 * browser's own scrolling of the active descendant does not work across it. Moving real focus
 * into the listbox works with every assistive technology that implements the listbox pattern at
 * all, and it is what `useRovingFocus` already does for composite widgets elsewhere in this
 * library.
 *
 * The trigger is a real `<button>` and the listbox is a real `role="listbox"`, so the two halves
 * are each correct on their own terms and the trigger's `aria-expanded`/`aria-haspopup` are real
 * state rather than decoration.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { composeHandlers, cx, useControllableState, useRovingFocus } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";
import { Popover } from "../popover";

/*
 * NOTE: this file deliberately does NOT import "./select.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

// The guard is imported from `select.types` because it belongs next to the union it narrows;
// `index.ts` re-exports it, so a consumer gets both from one specifier.
import {
  isOptionGroup,
  type SelectItem,
  type SelectOption,
  type SelectProps,
} from "./select.types";

/**
 * The selector that finds a Select's options.
 *
 * By role rather than by a marker attribute, because every option in a listbox has
 * `role="option"` already and adding `data-*` purely so a helper can find them would be a second
 * source of truth for what is structural.
 */
const OPTION_SELECTOR = '[role="option"]';

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * The text announced for an option or group.
 *
 * `textValue` wins, because a `label` containing an element or an image produces an accessible name
 * of nothing useful. Falls back to the label when it is a string, which is the common case.
 */
function announce(node: ReactNode, explicit: string | undefined): string {
  if (explicit !== undefined) return explicit;
  return typeof node === "string" ? node : "";
}

/** Flatten options and groups into one list, remembering group membership for rendering. */
interface FlatOption {
  option: SelectOption;
  /** The group's accessible name, or `undefined` for a top-level option. */
  groupLabel?: string | undefined;
}

function flatten(items: readonly SelectItem[]): FlatOption[] {
  const out: FlatOption[] = [];

  for (const item of items) {
    if (isOptionGroup(item)) {
      for (const option of item.options) {
        out.push({ option, groupLabel: announce(item.label, item.textValue) });
      }
      continue;
    }

    out.push({ option: item });
  }

  return out;
}

/**
 * A dropdown list.
 *
 * ```html
 * <div class="uir-select" data-size data-state>
 *   <label class="uir-select__label" for>…</label>
 *   <button class="uir-select__trigger" aria-haspopup="listbox" aria-expanded="false">
 *     <span class="uir-select__value">…</span>
 *   </button>
 *   <input type="hidden" name>                only when `name` is given
 *   <div class="uir-select__helper" id>…</div>
 * </div>
 * <!-- portalled -->
 * <div class="uir-select__listbox" role="listbox" aria-labelledby>
 *   <div role="group" aria-label="…"> <div role="option">…</div> </div>
 * </div>
 * ```
 */
export function Select(props: SelectProps) {
  const {
    id,
    label,
    options,
    value: valueProp,
    defaultValue,
    onChange,
    placeholder = "Select an option",
    helperText,
    size = "md",
    variant = "outline",
    tone = "neutral",
    invalid = false,
    disabled = false,
    required = false,
    fullWidth = false,
    closeOnOutsidePress = true,
    closeOnSelect = true,
    typeahead = true,
    typeaheadDelay = 1000,
    name,
    startAdornment,
    endAdornment,
    className,
    style,
    ref,
    ...rest
  } = props;

  const flat = useMemo(() => flatten(options), [options]);

  const [selected, setSelected] = useControllableState<string | null>({
    value: valueProp,
    // `undefined` must be forwarded as `undefined`, or the Select becomes permanently controlled
    // with nothing selected and silently ignores `defaultValue`. `null` means "controlled, nothing
    // selected", which is a real and common state.
    defaultValue: defaultValue ?? null,
    onChange: (next) => onChange?.(next ?? ""),
  });

  const [open, setOpen] = useState(false);
  /**
   * The index the user is on, separate from the index that is *selected*.
   *
   * APG listbox: moving the highlight does not change the selection until the user commits. MUI
   * conflates them, which is why its Select highlights a new option as you arrow over it and a
   * consumer has to undo it.
   */
  const [activeIndex, setActiveIndex] = useState(-1);

  /*
   * The listbox node as *state*, not as a ref.
   *
   * `Portal` gates on a `mounted` flag so it is SSR safe, which means the listbox does not exist on
   * the commit where `open` flips — it arrives one commit later. A focus effect keyed on
   * `[activeIndex, open]` therefore runs against `null` and never looks again, leaving focus on the
   * trigger while the listbox is open. Keying on the node itself means the effect re-runs the
   * moment the node appears.
   *
   * The same reason `Dialog` holds a `surfaceNode` instead of a ref for its focus trap.
   */
  const [listboxNode, setListboxNode] = useState<HTMLDivElement | null>(null);

  const attachListbox = useCallback((node: HTMLDivElement | null) => {
    setListboxNode(node);
  }, []);

  /* The trigger node, which is `Popover`'s anchor. */
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  /*
   * The consumer's ref, and the trigger node, in one mutable.
   *
   * Two reasons they are merged rather than kept separate with `composeRefs`:
   *
   * - `triggerRef` is the anchor for `Popover`, and `Popover`'s dismissal hook needs to know when
   *   the anchor is *this* node so a click on the trigger is not an outside press.
   * - `composeRefs` returns a new function whenever its inputs change, and a changed ref callback
   *   makes React detach and reattach it on the next commit. That is churn on every render of an
   *   open list, so one stable callback does both jobs.
   */
  const consumerRef = useRef<Ref<HTMLButtonElement>>(ref);
  consumerRef.current = ref;

  const attachTrigger = useCallback((node: HTMLButtonElement | null) => {
    triggerRef.current = node;

    const target = consumerRef.current;
    if (typeof target === "function") {
      target(node);
    } else if (target !== null && target !== undefined) {
      (target as { current: HTMLButtonElement | null }).current = node;
    }
  }, []);
  /** The index the list had when it opened, so Escape can restore the highlight. */
  const indexBeforeOpen = useRef(-1);
  const typeaheadRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  const selectedIndex = flat.findIndex((entry) => entry.option.value === selected);
  const hasSelection = selectedIndex !== -1;
  const hasLabel = isRenderable(label);
  const hasHelper = isRenderable(helperText);
  const helperId = hasHelper && id !== undefined ? `${id}-helper` : undefined;
  const describedBy = rest["aria-describedby"] ?? helperId;

  /*
   * The trigger's accessible name.
   *
   * `aria-labelledby` pointing at the visible label is preferred over `aria-label`, because the
   * label's own text is then the name and the two cannot drift apart. It is only emitted when
   * there is both a label and an id to point at; otherwise `aria-label` from the caller applies,
   * and `aria-haspopup="listbox"` with no name at all is a development warning below.
   *
   * Note this uses the label's *id* rather than wrapping the trigger in the `<label for>`, which
   * does happen but would be redundant: a `<label for>` on a `<button>` gives the button a name
   * only in browsers that support labelling buttons at all, and `aria-labelledby` is explicit and
   * universal.
   */
  const labelId = hasLabel && id !== undefined ? `${id}-label` : undefined;
  const restAriaLabel = rest["aria-label"];
  const restAriaLabelledBy = rest["aria-labelledby"];
  const labelledBy = labelId ?? restAriaLabelledBy;

  /** Every option that can actually be reached. Disabled ones are skipped by every path. */
  const enabledIndexes = useMemo(
    () => flat.map((entry, index) => (entry.option.disabled ? -1 : index)).filter((i) => i !== -1),
    [flat]
  );

  /** Step from `from` by `step`, skipping disabled options. Returns -1 when there are none. */
  const step = useCallback(
    (from: number, delta: number): number => {
      if (enabledIndexes.length === 0) return -1;

      const at = enabledIndexes.indexOf(from);
      if (at === -1) {
        // From an unhighlighted state, any direction lands on an edge: an arrow into a closed list
        // goes to the first or last option, which is what APG specifies.
        return delta > 0 ? (enabledIndexes[0] as number) : (enabledIndexes.at(-1) as number);
      }

      const next = Math.min(Math.max(at + delta, 0), enabledIndexes.length - 1);
      return enabledIndexes[next] as number;
    },
    [enabledIndexes]
  );

  const select = useCallback(
    (index: number) => {
      const entry = flat[index];
      if (entry === undefined || entry.option.disabled) return;

      setSelected(entry.option.value);
      setActiveIndex(index);
      if (closeOnSelect) setOpen(false);
    },
    [closeOnSelect, flat, setSelected]
  );

  /* ---- Opening ------------------------------------------------------- */

  const openList = useCallback(() => {
    if (disabled) return;

    /*
     * Where the highlight lands, and this is the one place the rule is decided.
     *
     * With a selection, the highlight goes to the selected option, so the listbox's position
     * matches what the trigger shows. Pressing Enter then re-selects what is already selected
     * rather than changing the value to something the user never chose.
     *
     * Without one, the highlight goes to the *first enabled* option rather than to nothing. That
     * is the rule worth arguing for, because the alternative — highlight nothing — leaves the open
     * listbox with no tab stop at all: focus stays on the trigger, and the roving-focus invariant
     * ("exactly one option is tabbable") is violated for as long as the list is open. Native
     * selects behave the same way, and it makes Enter a meaningful "take the first" rather than a
     * no-op. The cost is that opening an empty select and pressing Enter immediately selects the
     * first option, which is the documented trade-off.
     *
     * The browse keys do not come through here: they have already worked out where the highlight
     * should go, so they call `browse` directly.
     */
    const start = selectedIndex === -1 ? (enabledIndexes[0] ?? -1) : selectedIndex;

    indexBeforeOpen.current = selectedIndex;
    setActiveIndex(start);
    setOpen(true);
  }, [disabled, enabledIndexes, selectedIndex]);

  const closeList = useCallback(() => {
    setOpen(false);
    // The highlight goes back to the selection, so reopening lands where the user left it.
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  /*
   * Move focus to the highlighted option whenever the highlight moves, and when the listbox itself
   * appears.
   *
   * `listboxNode` is in the dependency array, and is the reason it is there: the node arrives one
   * commit *after* `open` flips, because `Portal` gates on a `mounted` flag. Without it in the
   * dependencies this effect runs once against `null` and never runs again, leaving focus on the
   * trigger while the listbox is open.
   *
   * `preventScroll` matters: the browser's default scrolls the focused element into view, which
   * scrolls the *page* too while the popover is still settling into place.
   */
  useEffect(() => {
    if (!open || activeIndex < 0) return;

    const option = listboxNode?.querySelectorAll<HTMLElement>(OPTION_SELECTOR)[activeIndex];
    option?.focus({ preventScroll: true });
    // Scrolls within the listbox's own scrollport, so the page does not move.
    option?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listboxNode, open]);

  /* ---- Roving focus -------------------------------------------------- */

  const { handleKeyDown } = useRovingFocus({
    orientation: "vertical",
    // No looping. A listbox that wraps from the last option to the first is disorienting when the
    // list is long, and APG only specifies looping for radio groups.
    loop: false,
    itemSelector: OPTION_SELECTOR,
  });

  /**
   * Typeahead: select the first option matching what the user typed, without opening the list.
   *
   * Characters accumulate within `typeaheadDelay` and reset after it, so "to" finds "Tokyo" and
   * typing "t", pausing, then "o" starts a new search rather than looking for "to". Repeated
   * characters cycle through the options starting with them, which is what every native select does
   * and what makes a long alphabet list navigable.
   */
  const runTypeahead = useCallback(
    (character: string) => {
      if (!typeahead || disabled || enabledIndexes.length === 0) return;

      const now = Date.now();
      const burst = typeaheadRef.current;

      // Repeated identical characters cycle: "aaa" walks through the three options starting with a.
      const repeat = burst.text.length > 0 && [...burst.text].every((c) => c === burst.text[0]);

      const text = now - burst.at > typeaheadDelay || repeat ? character : burst.text + character;
      typeaheadRef.current = { text, at: now };

      const needle = text.toLowerCase();

      const match = enabledIndexes.find((index) => {
        const entry = flat[index];
        if (entry === undefined) return false;
        return announce(entry.option.label, entry.option.textValue)
          .toLowerCase()
          .startsWith(needle);
      });

      if (match === undefined) return;

      setSelected(flat[match]?.option.value ?? "");
      setActiveIndex(match);
      if (open) closeList();
    },
    /*
     * `setSelected` is stable for as long as `value` is — `useControllableState` documents that
     * its setter identity is safe in dependency arrays — so it is deliberately absent. Every other
     * dependency here is a value this callback actually reads.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIndex, closeList, disabled, enabledIndexes, flat, open, step, typeahead, typeaheadDelay]
  );

  /**
   * Open the list and move the highlight to an option near `from`, without committing it.
   *
   * This is the single path for every "browse" key on a closed select — arrows, `Home` and `End` —
   * and it deliberately does **not** call `setSelected`. The APG listbox pattern says a `Down Arrow`
   * "opens the listbox if it is not already displayed and moves visual focus to the first option",
   * and committing on the way would break the one distinction this component exists to keep:
   * moving the highlight is not selecting.
   *
   * The cost of that choice is that there is no arrow-key path to changing the value without
   * opening the list. That is fine, because typeahead is the fast path and is on by default — see
   * the split documented on {@link SelectOwnProps.typeahead}.
   */
  const browse = useCallback(
    (from: number, delta: number) => {
      const next = step(from, delta);
      indexBeforeOpen.current = selectedIndex;
      setActiveIndex(next);
      setOpen(true);
    },
    [selectedIndex, step]
  );

  /* ---- Keyboard ------------------------------------------------------ */

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return;

    /*
     * Space and Enter are deliberately *not* handled here.
     *
     * The trigger is a real `<button>`, so the browser already activates it on both keys and fires a
     * `click`. Handling them again here means each press opens the list and then immediately closes
     * it: the keydown handler runs first, and the click that follows toggles the now-open list shut.
     * Letting the platform activate the button is also the reason `Button` and `Switch` need no
     * keydown handling at all.
     */

    // APG listbox: a browse key on a closed select opens the list and moves the highlight.
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (open) {
        setActiveIndex((current) => step(current, event.key === "ArrowDown" ? 1 : -1));
        return;
      }

      /*
       * Stepping from the current selection rather than to an edge is what makes holding the key
       * walk the list once it is open. On an empty select it lands on the first (or last) enabled
       * option anyway, because `step(-1, 1)` returns the first enabled index.
       */
      browse(selectedIndex, event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();

      if (open) {
        setActiveIndex(
          event.key === "Home" ? (enabledIndexes[0] ?? -1) : (enabledIndexes.at(-1) ?? -1)
        );
        return;
      }

      // Same rule as the arrows: browse, do not commit. A step of the full enabled length lands on
      // the opposite edge from wherever the highlight already is.
      browse(selectedIndex, event.key === "Home" ? -enabledIndexes.length : enabledIndexes.length);
      return;
    }

    /*
     * Escape closes the list even when focus is still on the trigger.
     *
     * `Popover`'s own Escape handling is disabled (`closeOnEscape={false}`) so the *listbox* can
     * restore its highlight, and the listbox only sees Escape when focus has moved into it. Without
     * this, opening with Space and pressing Escape leaves the list open — the one dismissal that
     * does not work from the position the user opened it from.
     */
    if (event.key === "Escape") {
      event.preventDefault();
      closeList();
      return;
    }

    /*
     * Alt+Arrow has to be tested *before* the bare arrows: `event.key` is still `ArrowDown` with
     * `altKey` set, so an arrow branch above this one would swallow it and open the list instead of
     * toggling it. This is the second of UI5's two documented open/close spellings
     * ("[F4] / [Alt] + [Up] / [Alt] + [Down] / [Space] or [Enter] - Opens/closes the drop-down").
     */
    if (event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      if (open) closeList();
      else openList();
      return;
    }

    /*
     * Tab closes the list and is *not* prevented, so focus continues on to the next control in the
     * form.
     *
     * Focus is in the listbox by the time this can be reached, so this is the defensive path for
     * the one-render window before the focus effect lands. Preventing the default here would strand
     * focus on the trigger; letting it through moves focus onward, which is what Tab means.
     */
    if (event.key === "Tab") {
      closeList();
      return;
    }

    if (event.key === "F4") {
      event.preventDefault();
      if (open) closeList();
      else openList();
      return;
    }

    // A single printable character, and not a modifier combination.
    if (!event.ctrlKey && !event.metaKey && event.key.length === 1 && !open) {
      runTypeahead(event.key);
    }
  };

  const onListboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") {
      // Close and put the highlight back, rather than committing whatever was highlighted.
      event.preventDefault();
      setActiveIndex(indexBeforeOpen.current);
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (activeIndex >= 0) select(activeIndex);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Tab") {
      // Tab closes rather than being trapped. Trapping it inside a dropdown is what makes a list of
      // forty options impossible to leave with a keyboard.
      event.preventDefault();
      closeList();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const edge = event.key === "Home" ? enabledIndexes[0] : enabledIndexes.at(-1);
      if (edge !== undefined) setActiveIndex(edge);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const from = event.currentTarget.ownerDocument.activeElement;
      const index = from instanceof HTMLElement ? enabledIndexes.indexOf(numberOf(from, flat)) : -1;
      setActiveIndex(step(index, event.key === "ArrowDown" ? 1 : -1));
      return;
    }

    if (!event.ctrlKey && !event.metaKey && event.key.length === 1) {
      event.preventDefault();
      runTypeahead(event.key);
      return;
    }

    // Everything else — PageUp, PageDown, and anything else — falls through to the roving handler,
    // which implements Home/End and loops. Home/End are handled above so they do not loop.
    handleKeyDown(event);
  };

  /* ---- Development warnings ------------------------------------------ */

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    if (id === undefined) {
      if (hasLabel) {
        console.warn(
          "Select: `label` was passed without an `id`, so the visible label is not associated " +
            "with the trigger and the listbox has no accessible name. Pass an `id`."
        );
      }
      return;
    }

    if (!hasLabel && restAriaLabel === undefined && restAriaLabelledBy === undefined) {
      console.warn(
        "Select: no accessible name. Pass `label`, `aria-label` or `aria-labelledby`. A button " +
          'with `aria-haspopup="listbox"` and no name announces only "button, collapsed".'
      );
    }
  }, [hasLabel, id, restAriaLabel, restAriaLabelledBy]);

  /* ---- Rendering ----------------------------------------------------- */

  const displayText = hasSelection ? (flat[selectedIndex] as FlatOption).option.label : placeholder;

  return (
    <div
      className={cx("uir-select", className)}
      style={style}
      data-size={size}
      data-variant={variant}
      data-tone={tone}
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-required={required ? "" : undefined}
      data-full-width={fullWidth ? "" : undefined}
      data-empty={hasSelection ? undefined : ""}
    >
      {hasLabel ? (
        <label className="uir-select__label" id={labelId} htmlFor={id}>
          {label}
          {required ? (
            <>
              <span aria-hidden="true"> *</span>
              <span className="uir-visually-hidden">
                {` ${resolveMessage(undefined, BASE_MESSAGES, "common.required")}`}
              </span>
            </>
          ) : null}
        </label>
      ) : null}

      {/*
        A real `<button>`, not a `div` with `role="combobox"`.
        `aria-haspopup="listbox"` and `aria-expanded` are real state on a real control, and the
        browser's own Space/Enter activation comes for free. APG's select-only combobox would put
        focus on the listbox from the start; that is the other valid pattern and it would need the
        text input this component does not have.
      */}
      <button
        {...rest}
        ref={attachTrigger}
        id={id}
        type="button"
        className="uir-select__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-labelledby={labelledBy}
        onClick={composeHandlers(
          () => {
            if (open) closeList();
            else openList();
          },
          rest.onClick as ((event: React.MouseEvent<HTMLButtonElement>) => void) | undefined
        )}
        onKeyDown={onTriggerKeyDown}
      >
        {isRenderable(startAdornment) ? (
          <span className="uir-select__adornment uir-select__adornment--start" aria-hidden="true">
            {startAdornment}
          </span>
        ) : null}

        <span className="uir-select__value">{displayText}</span>

        {isRenderable(endAdornment) ? (
          <span className="uir-select__adornment uir-select__adornment--end" aria-hidden="true">
            {endAdornment}
          </span>
        ) : null}

        {/*
          The chevron is a CSS triangle rather than an SVG or an icon slot, for the same reason as
          `Popover`'s arrow, and it is `aria-hidden` because `aria-expanded` already says whether
          the list is open.
        */}
        <span className="uir-select__chevron" aria-hidden="true" />
      </button>

      {/*
        The trigger is a `<button>`, and a button submits nothing. A hidden input carries the value
        so the form actually receives it — which is UI5's `@formProperty` and MUI's `name`
        behaviour, reached through the one element the platform offers.
      */}
      {name === undefined ? null : (
        <input type="hidden" name={name} value={selected ?? ""} disabled={disabled} readOnly />
      )}

      {hasHelper ? (
        <div className="uir-select__helper" id={helperId}>
          {helperText}
        </div>
      ) : null}

      {/*
        `Popover` is composed for the positioning, the portal, the outside-press dismissal and the
        anchor-out-of-view dismissal — all of which a listbox genuinely needs and none of which is
        worth reimplementing. What `Select` keeps to itself is the keyboard contract, the selection
        model and the roles, because those are the component.

        `closeOnEscape={false}` and `modal` unset: a dropdown must never be modal and must not take
        focus away from the listbox, which manages focus itself.
      */}
      <Popover
        open={open}
        onOpenChange={(next) => {
          // `Popover` closes on Escape and on an outside press; the listbox handles Escape itself so
          // it can restore the highlight, so it only needs to react to a dismissal it did not
          // initiate.
          if (!next) closeList();
        }}
        anchor={triggerRef}
        placement="bottom"
        align="stretch"
        id={id === undefined ? undefined : `${id}-listbox`}
        className="uir-select__popover"
        closeOnEscape={false}
        closeOnOutsidePress={closeOnOutsidePress}
        closeOnAnchorOutOfView
        title={undefined}
        label={typeof label === "string" ? label : undefined}
      >
        <div
          ref={attachListbox}
          className="uir-select__listbox"
          role="listbox"
          aria-labelledby={labelledBy}
          onKeyDown={onListboxKeyDown}
          onClick={(event) => {
            // Committing on the listbox's own click means a press anywhere on an option selects it,
            // without each option carrying its own handler.
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            const option = target.closest<HTMLElement>(OPTION_SELECTOR);
            if (option === null) return;

            select(numberOf(option, flat));
          }}
        >
          {options.map((item, itemIndex) => {
            if (isOptionGroup(item)) {
              const groupId = id === undefined ? undefined : `${id}-group-${itemIndex}`;

              return (
                <div
                  key={groupId ?? itemIndex}
                  className="uir-select__group"
                  role="group"
                  aria-label={announce(item.label, item.textValue)}
                  id={groupId}
                >
                  <div className="uir-select__group-label" aria-hidden="true">
                    {item.label}
                  </div>
                  {item.options.map((option) => renderOption(option))}
                </div>
              );
            }

            return renderOption(item);
          })}
        </div>
      </Popover>
    </div>
  );

  /** One option. Declared inside the component so it closes over `flat` and `activeIndex`. */
  function renderOption(option: SelectOption) {
    const index = flat.findIndex((entry) => entry.option.value === option.value);
    const isSelected = option.value === selected;
    const isActive = index === activeIndex;

    return (
      <div
        key={option.value}
        role="option"
        className="uir-select__option"
        aria-selected={isSelected}
        aria-disabled={option.disabled || undefined}
        tabIndex={isActive ? 0 : -1}
        data-uir-value={option.value}
        data-active={isActive ? "" : undefined}
        data-selected={isSelected ? "" : undefined}
        data-disabled={option.disabled ? "" : undefined}
      >
        <span className="uir-select__option-label">
          {option.label}
          {isRenderable(option.children) ? (
            <span className="uir-select__option-detail">{option.children}</span>
          ) : null}
        </span>
      </div>
    );
  }
}

/**
 * An element's index among the options.
 *
 * Read from `data-uir-value` rather than by comparing DOM order, because grouped options are
 * nested inside group elements and `querySelectorAll` order is not the same as a flattened index
 * once groups exist.
 */
function numberOf(element: HTMLElement, flat: readonly FlatOption[]): number {
  const value = element.dataset["uirValue"];
  if (value === undefined) return -1;

  return flat.findIndex((entry) => entry.option.value === value);
}
