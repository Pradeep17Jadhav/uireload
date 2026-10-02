/**
 * Tab bar.
 *
 * `role="tablist"`, `role="tab"` and `role="tabpanel"`, with the APG tabs pattern's keyboard contract
 * on top: one tab stop for the whole strip, and arrow keys that move focus between tabs.
 *
 * Manual activation by default, which is the single most consequential decision here and the one the
 * APG is explicit about. Arrow keys move *focus*; Enter or Space moves *selection*. The alternative —
 * moving selection as focus moves — means arrowing past four tabs fires four network requests, and on a
 * tab set that is not wrapped in a router it destroys the form data on the tab the user left.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { composeHandlers, composeRefs, cx, useControllableState } from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./tab-bar.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { TabBarProps } from "./tab-bar.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

export function TabBar(props: TabBarProps) {
  const {
    label,
    items,
    value: valueProp,
    defaultValue,
    onValueChange,
    lazy = false,
    orientation = "horizontal",
    indicatorPosition = "auto",
    scrollable = true,
    activation = "automatic",
    disabled = false,
    className,
    style,
    ref,
    onKeyDown,
    ...rest
  } = props;

  const baseId = useId();
  const stripRef = useRef<HTMLDivElement>(null);

  /* ---- Which tabs can be reached -------------------------------------- */

  const reachable = useMemo(
    () => items.filter((item) => item.disabled !== true).map((item) => item.value),
    [items]
  );

  /*
   * The selected tab, defaulted to the first selectable one.
   *
   * Defaulting rather than allowing "nothing selected" is why `value` is `string | undefined` rather
   * than `string | null`: a `tablist` with no selected tab has panels that are all `aria-hidden` and an
   * association that means nothing.
   *
   * The `?? ""` fallback is a last resort for the empty case — a bar with no items, or one where every
   * item is disabled. It selects nothing rather than selecting an absent value, and the component is
   * documented as requiring at least one selectable item.
   */
  const fallback = reachable[0] ?? "";

  const [selected, setSelected] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? fallback,
    onChange: onValueChange,
  });

  /* ---- Focus ---------------------------------------------------------- */

  /*
   * Which tab holds focus, which is not the same as which is selected.
   *
   * Plain state, not `useControllableState`: it is internal, and exposing it would put a second source
   * of truth for "which tab" on the public API. It exists at all because under *manual* activation the
   * two genuinely differ — arrowing across the strip moves focus and leaves the selection where it was.
   */
  const [focused, setFocused] = useState<string | undefined>(selected);

  const focusTab = useCallback((value: string) => {
    const node = stripRef.current?.querySelector<HTMLElement>(
      `[data-uir-value="${CSS.escape(value)}"]`
    );
    node?.focus({ preventScroll: true });
  }, []);

  /**
   * Select a tab, moving focus with it.
   *
   * One function for both, because a tab that is selected but not focused — or focused but not
   * selected, under automatic activation — is a state the keyboard cannot produce and the mouse can
   * only produce by accident.
   */
  const select = useCallback(
    (value: string) => {
      if (disabled) return;
      setSelected(value);
      setFocused(value);
      focusTab(value);
    },
    [disabled, focusTab, setFocused, setSelected]
  );

  /* ---- Keyboard ------------------------------------------------------- */

  /**
   * Whether an arrow key should change the selection as well as the focus.
   *
   * `automatic` means the platform's convention: a horizontal strip is a list of things you press, so
   * Enter and Space activate; a vertical strip is a listbox, so the arrows do. Which is why the mode is
   * derived from the orientation rather than being one flat default.
   */
  const autoActivate =
    activation === "automatic-activation" ||
    (activation === "automatic" && orientation === "vertical");

  const step = useCallback(
    (delta: number) => {
      if (reachable.length === 0) return;

      /*
       * Move from **focus**, not from the selection.
       *
       * They are the same thing only under automatic activation. Under manual activation the selection
       * is wherever the user last pressed Enter, and stepping from it would send the user somewhere
       * they did not navigate to — the strip would appear to ignore the arrow keys after the first
       * one.
       */
      const from = focused !== undefined ? reachable.indexOf(focused) : 0;
      const next = reachable[(Math.max(from, 0) + delta + reachable.length) % reachable.length];
      if (next === undefined) return;

      if (autoActivate) {
        select(next);
        return;
      }

      setFocused(next);
      focusTab(next);
    },
    [autoActivate, focusTab, focused, reachable, select, setFocused]
  );

  const goTo = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;
      if (autoActivate) {
        select(value);
        return;
      }
      setFocused(value);
      focusTab(value);
    },
    [autoActivate, focusTab, select, setFocused]
  );

  const onKeyDownInner = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return;

    /*
     * Which tab the key applies to.
     *
     * Read from the event target rather than from `focused`, because a mouse click sets focus without
     * going through the roving handler and the two would otherwise disagree until the first keypress.
     */
    const target = event.target as HTMLElement;
    const value = target.dataset["uirValue"];
    if (value === undefined) return;

    const index = reachable.indexOf(value);
    if (index === -1) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        step(1);
        return;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        step(-1);
        return;
      case "Home":
        event.preventDefault();
        goTo(reachable[0]);
        return;
      case "End":
        event.preventDefault();
        goTo(reachable[reachable.length - 1]);
        return;
      case "Enter":
      case " ":
        /*
         * Select the focused tab.
         *
         * `preventDefault` on Space, or the page scrolls behind the tab strip — which is the classic
         * symptom of a control that handles Space without claiming it.
         */
        event.preventDefault();
        select(value);
        return;
      default:
    }
  };

  const handleKeyDown = composeHandlers<React.KeyboardEvent<HTMLDivElement>>(
    onKeyDownInner,
    onKeyDown
  );

  /* ---- Keeping focus legal -------------------------------------------- */

  /**
   * Focus follows a selection made from outside.
   *
   * A controlled tab bar whose `value` changes without the user touching it — a deep link, a reset
   * button — would otherwise leave focus on a tab that is no longer selected while the selected tab is
   * the one the keyboard user believes they are on.
   */
  useEffect(() => {
    if (selected === undefined) return;
    if (stripRef.current === null) return;
    if (stripRef.current.contains(document.activeElement)) return;

    setFocused(selected);
  }, [selected]);

  const selectedTone = items.find((item) => item.value === selected)?.tone ?? "neutral";

  return (
    <div
      {...rest}
      className={cx("uir-tab-bar", className)}
      style={style}
      data-orientation={orientation}
      data-disabled={disabled ? "" : undefined}
      data-scrollable={scrollable ? "" : undefined}
      data-indicator={indicatorPosition === "auto" ? "auto" : indicatorPosition}
      data-tone={selectedTone}
    >
      {/*
        The strip.

        `role="tablist"` with an `aria-orientation` that is *not* stated for a horizontal bar, because
        `horizontal` is the default value and stating it is redundant markup for every reader. The
        vertical case states it, and the arrow keys follow the same axis.
      */}
      <div
        ref={composeRefs(stripRef, ref)}
        role="tablist"
        className="uir-tab-bar__strip"
        aria-label={label}
        aria-orientation={orientation === "vertical" ? "vertical" : undefined}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const isSelected = item.value === selected;
          const isFocused = item.value === focused;
          const isDisabled = disabled || item.disabled === true;
          /*
           * `textValue` only, and never derived from a plain-text label.
           *
           * An `aria-label` *replaces* the content, so setting one from a plain-text label would drop
           * the badge out of the accessible name — which is exactly the case the badge exists for. A
           * plain-text label needs no override because the platform derives the name correctly.
           */
          const text = item.textValue;

          return (
            <button
              key={item.value}
              /*
               * `data-uir-value` rather than a generated per-tab id for the strip's own selector: a
               * value can contain characters that are awkward in an id and in an attribute selector.
               * This is the `data-uir-*` namespace doing its job — it is read by `step`, not styled.
               */
              data-uir-value={item.value}
              id={`${baseId}-tab-${CSS.escape(item.value)}`}
              type="button"
              role="tab"
              className="uir-tab-bar__tab"
              aria-selected={isSelected}
              /*
               * `aria-controls` only when there is a panel to control.
               *
               * An `aria-controls` pointing at an id that does not exist is an invalid ARIA value, and
               * axe reports it as critical — which is correct, because a reference that resolves to
               * nothing tells a screen reader the tab is broken. A consumer rendering their own panel
               * reads the tab's `id` from the DOM and associates it themselves.
               */
              aria-controls={
                isRenderable(item.panel) ? `${baseId}-panel-${CSS.escape(item.value)}` : undefined
              }
              aria-label={text}
              disabled={isDisabled}
              data-selected={isSelected ? "" : undefined}
              data-focused={isFocused ? "" : undefined}
              data-tone={item.tone ?? "neutral"}
              /*
               * The roving tabindex.
               *
               * Exactly one tab is tabbable, so Tab enters the strip once and leaves on the next press.
               * Every tab being tabbable would make a five-tab strip cost six Tab presses to cross.
               */
              tabIndex={isFocused && !isDisabled ? 0 : -1}
              onFocus={() => {
                if (isDisabled) return;
                setFocused(item.value);
                /*
                 * Automatic activation on focus.
                 *
                 * Guarded on the *next* tab being different, so holding an arrow key through a
                 * selection does not re-select it fifty times a second.
                 */
                if (autoActivate && item.value !== selected) select(item.value);
              }}
              onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(() => {
                select(item.value);
              }, undefined)}
            >
              <span className="uir-tab-bar__label">{item.label}</span>

              {/*
                The badge is inside the button and inside the tab's label, so it is part of the
                accessible name. A count that a screen reader cannot announce is a count only sighted
                users see — which is the opposite of what a count is for.
              */}
              {isRenderable(item.badge) ? (
                <span className="uir-tab-bar__badge">{item.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/*
        The panels.
        *
        `role="tabpanel"`, `aria-labelledby` back at its tab, and `tabIndex={0}` so a keyboard user can
        scroll it — a panel with no tab stop is a panel whose overflow is unreachable from the
        keyboard.
        *
        `hidden` rather than unmounted unless `lazy` is set, so find-in-page still finds a panel the
        user cannot currently see.
        */}
      {items.map((item) => {
        if (!isRenderable(item.panel)) return null;

        /*
         * `lazy` unmounts the unselected panels; the default keeps them mounted and `hidden`.
         *
         * Unmounting is what a consumer opts into — it is cheaper — and it is opt-in because it costs
         * find-in-page: a user searching the page for text they can see in another tab cannot find it
         * if that tab was never rendered.
         */
        if (lazy && item.value !== selected) return null;

        return (
          <div
            key={`panel-${item.value}`}
            id={`${baseId}-panel-${CSS.escape(item.value)}`}
            role="tabpanel"
            className="uir-tab-bar__panel"
            aria-labelledby={`${baseId}-tab-${CSS.escape(item.value)}`}
            tabIndex={0}
            hidden={item.value !== selected}
          >
            {item.panel}
          </div>
        );
      })}
    </div>
  );
}
