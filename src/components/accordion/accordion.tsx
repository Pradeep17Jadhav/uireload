/**
 * Accordion.
 *
 * A vertically stacked set of headings, each one a control that reveals its own
 * section. The whole pattern is about **structure a screen reader can navigate**:
 * the header is a heading, the panel is a region named by that heading, and the two
 * are wired together with `aria-controls` / `aria-labelledby`.
 *
 * The APG keyboard contract is deliberately small — Enter and Space toggle, Tab
 * moves on — and it is implemented here by using a real `<button>` and adding
 * nothing. There is no arrow-key roving focus here, because the pattern keeps every
 * header *and* every expanded panel's content in the page's natural tab sequence.
 * Adding Up/Down/Home/End would be a toolbar pattern that this widget is not, and
 * would make the arrow keys disagree with the Tab order that is actually in force.
 *
 * `selectionMode` is a discriminated union rather than a flag because the two modes
 * cannot share one value type: a single open id is `string | null`, several are
 * `readonly string[]`, and one `unknown` prop would push that cast onto every
 * consumer. Internally both modes normalise to a set of ids, so there is only one
 * toggle path and only one place that can be wrong.
 */

import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { composeHandlers, cx, useControllableState } from "../../internal";

import type { AccordionItem, AccordionProps } from "./accordion.types";

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(props, ref) {
  const {
    items,
    selectionMode = "single",
    allowAllClosed = true,
    headingLevel = 3,
    variant = "outlined",
    size = "md",
    lazy = false,
    disabled = false,
    className,
    style,
    onClick,
    /*
     * Destructured purely to keep them out of `...rest`.
     *
     * `value`, `defaultValue` and `onExpandedChange` are ours, not DOM attributes, and a discriminated
     * union means they cannot be named precisely enough to strip by type. Left in `...rest` they would be
     * spread onto the root `div`, and React would warn about an unknown `onExpandedChange` handler in
     * every consumer's console.
     */
    value: _value,
    defaultValue: _defaultValue,
    onExpandedChange: _onExpandedChange,
    ...rest
  } = props;

  const multiple = selectionMode === "multiple";

  /*
   * Both modes normalise to a set of ids, and the callback is adapted back to the
   * shape the caller asked for. One toggle path, one place to be wrong.
   */
  const singleValue = props.value as string | null | undefined;
  const multipleValue = props.value as readonly string[] | undefined;
  const singleDefault = props.defaultValue as string | null | undefined;
  const multipleDefault = props.defaultValue as readonly string[] | undefined;
  const onSingleChange = props.onExpandedChange as ((id: string | null) => void) | undefined;
  const onMultipleChange = props.onExpandedChange as ((ids: readonly string[]) => void) | undefined;

  const controlled = multiple
    ? multipleValue
    : singleValue === null
      ? []
      : singleValue === undefined
        ? undefined
        : [singleValue];
  const uncontrolledDefault = multiple
    ? multipleDefault
    : singleDefault === null
      ? []
      : singleDefault === undefined
        ? []
        : [singleDefault];

  const [open, setOpen] = useControllableState<readonly string[]>({
    value: controlled,
    defaultValue: uncontrolledDefault ?? [],
    onChange: (next) => {
      if (multiple) {
        onMultipleChange?.(next);
      } else {
        onSingleChange?.(next.length === 0 ? null : (next[0] ?? null));
      }
    },
  });

  const baseId = useId();

  /*
   * `lazy` needs to know whether a panel was *ever* open, which is not derivable
   * from the current set — a panel that was open and then closed is still visited.
   *
   * Grown monotonically, and never shrunk: a consumer closing a panel in controlled mode is telling us
   * the state, not asking us to forget the history. Returning the current set when nothing new is open is
   * what keeps this from re-rendering forever when `value` is a fresh array literal on every render.
   */
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set(open));

  useEffect(() => {
    setVisited((current) => {
      if (open.every((id) => current.has(id))) return current;
      const next = new Set(current);
      for (const id of open) next.add(id);
      return next;
    });
  }, [open]);

  const openSet = useMemo(() => new Set(open), [open]);

  const toggle = (item: AccordionItem) => {
    const isOpen = openSet.has(item.id);

    /*
     * In single mode with `allowAllClosed={false}`, an open panel refuses to close.
     *
     * The APG handles this by leaving the header operable but marking it `aria-disabled`, which is set
     * below — an inert-looking header that silently swallowed Enter would be worse, because the user would
     * have no way to tell a disabled control from a broken one.
     */
    if (!multiple && isOpen && !allowAllClosed) return;

    if (multiple) {
      setOpen(isOpen ? open.filter((id) => id !== item.id) : [...open, item.id]);
    } else {
      setOpen(isOpen ? [] : [item.id]);
    }
  };

  /*
   * The heading tag is computed from the prop rather than chosen from a fixed map.
   *
   * `AccordionHeadingLevel` is the union `2 | 3 | 4 | 5 | 6`, so the template literal already resolves to
   * `"h2" | "h3" | "h4" | "h5" | "h6"` with no cast. The annotation is here because JSX cannot use a
   * template-literal-derived string as an element type directly, and a lookup table would add an entry
   * that could fall out of step with the union.
   */
  const Heading: "h2" | "h3" | "h4" | "h5" | "h6" = `h${headingLevel}`;

  /*
   * A consumer's `onClick` belongs on the root, so that a click anywhere inside — a header, or a link deep
   * in a panel's content — reaches it by ordinary bubbling. But the toggle has to run *after* the consumer
   * handler so that `preventDefault()` can still opt out of it, and the header is the event's target, so
   * its handler runs first.
   *
   * The two are reconciled with a flag rather than with `stopPropagation`, which would also suppress a
   * consumer's own capture-phase handler and break delegation they may have set up on an ancestor:
   *
   *  - a header click calls the consumer handler once, from the header, then toggles;
   *  - the same event then bubbles to the root, which sees the flag and stays quiet;
   *  - any other click reaches the root and calls the handler there, with nothing pending.
   */
  const headerClickHandled = useRef(false);

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("uir-accordion", className)}
      style={style}
      data-selection-mode={selectionMode}
      data-size={size}
      data-variant={variant}
      onClick={(event) => {
        if (headerClickHandled.current) {
          headerClickHandled.current = false;
          return;
        }
        onClick?.(event);
      }}
    >
      {items.map((item, index) => {
        const isOpen = openSet.has(item.id);
        const itemDisabled = disabled || item.disabled === true;

        /*
         * Ids are derived from the index, not from `item.id`.
         *
         * `item.id` is the caller's state key and may contain anything; it is used for that and never put
         * in the DOM. The index is already unique here and is always a valid `id`, so the `aria-controls`
         * / `aria-labelledby` pair cannot be broken by a consumer's id containing a space or a quote.
         */
        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        /*
         * Set only when the panel is open and the accordion will not let it close. That combination is the
         * only one where the control is focusable and meaningful but cannot be activated.
         */
        const cannotCollapse = isOpen && !multiple && !allowAllClosed;

        return (
          <div
            key={item.id}
            className="uir-accordion__item"
            data-expanded={isOpen ? "" : undefined}
            data-disabled={itemDisabled ? "" : undefined}
            data-tone={item.tone}
          >
            <Heading className="uir-accordion__heading">
              {/*
                The button is the *only* thing inside the heading element.

                The pattern says so explicitly, and it is what keeps the heading's accessible name equal
                to the button's: a chevron or a badge rendered beside the label inside the heading would
                make the heading read as "Title Collapse", which is a different label from the one the
                button announces.
              */}
              <button
                type="button"
                id={triggerId}
                className="uir-accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-disabled={cannotCollapse || undefined}
                disabled={itemDisabled}
                data-expanded={isOpen ? "" : undefined}
                onClick={(event) => {
                  composeHandlers(
                    () => toggle(item),
                    onClick as ((event: { defaultPrevented: boolean }) => void) | undefined
                  )(event);

                  /*
                   * Marked only once the consumer handler has had its turn, so a `preventDefault()` that
                   * vetoed the toggle does not also swallow the root-level call the event is about to make.
                   */
                  headerClickHandled.current = true;
                }}
              >
                <span className="uir-accordion__title">{item.title}</span>
                {/*
                  A CSS-drawn chevron, matching how every other disclosure affordance in the library is
                  drawn: no icon import, no `sx`, and `aria-hidden` because "collapsed" is already carried
                  by `aria-expanded` and saying it twice is noise.
                */}
                <span className="uir-accordion__icon" aria-hidden="true" />
              </button>
            </Heading>

            <div
              id={panelId}
              className="uir-accordion__panel"
              /*
               * `role="region"` plus `aria-labelledby` makes the panel a landmark named by its own header,
               * so a screen reader user can jump to it by name.
               *
               * The pattern calls this optional and warns against region proliferation — it advises against
               * it above roughly six simultaneously expandable panels. That guidance is recorded in the
               * component README rather than papered over, because whether six is too many depends on the
               * page and not on the component.
               */
              role="region"
              aria-labelledby={triggerId}
              /*
               * `hidden` rather than a CSS-only collapse, because `hidden` is what removes the panel from
               * the tab sequence and from the accessibility tree. A panel hidden with `height: 0` and
               * `overflow: hidden` is still focusable, so its links would be reachable by Tab while being
               * invisible — which is the single worst failure a disclosure widget can have.
               */
              hidden={!isOpen}
            >
              {lazy && !visited.has(item.id) ? null : item.children}
            </div>
          </div>
        );
      })}
    </div>
  );
});
