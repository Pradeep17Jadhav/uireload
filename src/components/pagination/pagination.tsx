/**
 * Pagination.
 *
 * A `<nav>` of real `<button>`s. No counterpart exists in either reference library, so this surface is
 * derived from the WAI-ARIA pagination pattern and recorded as a finding in `docs/references.md`.
 *
 * The one thing that makes it more than a row of buttons is the **status region**: pressing a page
 * number moves a pressed state and loads content, and neither is announced. Without it a screen reader
 * user has pressed something and been told nothing.
 */

import { forwardRef, useMemo } from "react";
import { composeHandlers, cx } from "../../internal";
import { formatMessage, resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./pagination.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { PaginationProps } from "./pagination.types";

/** A gap in the sequence, rendered as an ellipsis and not focusable. */
const ELLIPSIS = "ellipsis" as const;

type Slot = number | typeof ELLIPSIS;

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(props, ref) {
  const {
    page = 0,
    pageCount,
    onPageChange,
    siblingCount = "auto",
    showEdges = true,
    announcePosition = true,
    pageLabel,
    previousLabel,
    nextLabel,
    firstLabel,
    lastLabel,
    size = "md",
    disabled = false,
    className,
    style,
    ...rest
  } = props;

  const noun = pageLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.page");
  const prevName = previousLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.previousPage");
  const nextName = nextLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.nextPage");
  const firstName = firstLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.firstPage");
  const lastName = lastLabel ?? resolveMessage(undefined, BASE_MESSAGES, "common.lastPage");

  /*
   * The page is clamped before anything else.
   *
   * `page` is a number the consumer passes, and a consumer whose total shrank under a stale index
   * would otherwise render a control with nothing pressed and every button pointing at a page that
   * does not exist.
   */
  const last = Math.max(0, Math.floor(pageCount) - 1);
  const current = Math.min(Math.max(0, Math.floor(page)), last);

  const go = (target: number): void => {
    if (disabled) return;
    // Out of range and no-op clicks are not changes, so they are not reported.
    if (target < 0 || target > last) return;
    if (target === current) return;
    onPageChange?.(target);
  };

  /*
   * The page-number window.
   *
   * First and last are always present, with a run around the current page between them. Dropping
   * either end would put the end of the collection two clicks away and out of sight, which is the
   * thing a page-number row exists to prevent.
   *
   * `all` is an explicit opt-out rather than a size-based guess: the point at which a row of numbers
   * stops fitting is a question about the container, which this component cannot measure.
   */
  const slots = useMemo<Slot[]>(() => {
    if (siblingCount === "all" || last < 5) {
      return Array.from({ length: last + 1 }, (_, index) => index);
    }

    const siblings = siblingCount === "auto" ? 1 : siblingCount;
    const window = new Set<number>([0, last, current]);

    for (let offset = 1; offset <= siblings; offset += 1) {
      window.add(current - offset);
      window.add(current + offset);
    }

    const sorted = [...window].filter((value) => value >= 0 && value <= last).sort((a, b) => a - b);

    const out: Slot[] = [];
    let previous = -1;

    for (const value of sorted) {
      if (previous !== -1 && value - previous > 1) out.push(ELLIPSIS);
      out.push(value);
      previous = value;
    }

    return out;
  }, [current, last, siblingCount]);

  /*
   * A single page has nothing to paginate.
   *
   * Rendered as nothing at all rather than as one disabled button: a control taking space on screen
   * with nothing to say is worse than no control, and on a list of twenty tables it is twenty rows of
   * dead weight.
   */
  if (last < 1) return null;

  const item = (
    <button
      key="edge"
      type="button"
      className="uir-pagination__control"
      aria-label={firstName}
      disabled={disabled || current === 0}
      onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(() => go(0), undefined)}
    >
      <span className="uir-pagination__chevron" data-direction="first" aria-hidden="true" />
    </button>
  );

  return (
    <nav
      {...rest}
      ref={ref}
      /*
       * `aria-label`, not `aria-labelledby` from the surrounding page.
       *
       * A `<nav>` with no name is announced as "navigation" alongside every other `<nav>` on the
       * page, and a user moving between them by landmark has nothing to tell them apart.
       */
      aria-label={`${noun}s`}
      className={cx("uir-pagination", className)}
      style={style}
      data-size={size}
      data-disabled={disabled ? "" : undefined}
    >
      {showEdges ? item : null}

      {showEdges ? (
        <button
          type="button"
          className="uir-pagination__control"
          aria-label={prevName}
          disabled={disabled || current === 0}
          onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(
            () => go(current - 1),
            undefined
          )}
        >
          <span className="uir-pagination__chevron" data-direction="prev" aria-hidden="true" />
        </button>
      ) : null}

      {slots.map((slot) =>
        slot === ELLIPSIS ? (
          /*
           * The gap.
           *
           * `aria-hidden`, because it carries no information a screen reader can use: the gap is a
           * visual compression of a range, and announcing "ellipsis" is announcing a piece of CSS.
           */
          <span key="gap" className="uir-pagination__gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={slot}
            type="button"
            className="uir-pagination__page"
            /*
             * `aria-current="page"`, not `aria-pressed`.
             *
             * The current page is a position, not a toggle the user pressed. `aria-pressed` tells a
             * screen reader "this button is on", which is a claim about the control; `aria-current`
             * says "this is where you are", which is a claim about the collection — and it is the one
             * a user moving through pages needs.
             */
            aria-current={slot === current ? "page" : undefined}
            aria-label={`${noun} ${slot + 1}`}
            disabled={disabled}
            data-current={slot === current ? "" : undefined}
            onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(
              () => go(slot),
              undefined
            )}
          >
            {slot + 1}
          </button>
        )
      )}

      {showEdges ? (
        <button
          type="button"
          className="uir-pagination__control"
          aria-label={nextName}
          disabled={disabled || current === last}
          onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(
            () => go(current + 1),
            undefined
          )}
        >
          <span className="uir-pagination__chevron" data-direction="next" aria-hidden="true" />
        </button>
      ) : null}

      {showEdges ? (
        <button
          type="button"
          className="uir-pagination__control"
          aria-label={lastName}
          disabled={disabled || current === last}
          onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(() => go(last), undefined)}
        >
          <span className="uir-pagination__chevron" data-direction="last" aria-hidden="true" />
        </button>
      ) : null}

      {/*
        The status region.
       *
        Always present, never conditionally rendered — a live region that appears with its content is
        the same failure `Snackbar` documents. `aria-live="polite"`, because a page change is
        announced after whatever the user is currently reading rather than cutting it off.
       */}
      {announcePosition ? (
        <span className="uir-pagination__status" role="status" aria-live="polite">
          {/*
            Composed through `formatMessage` rather than by string concatenation.
           *
            "Page 3 of 12" in English is "Seite 3 von 12" in German and "ページ 3 / 12" in Japanese — the
            word order is not the same, so a template with a `{total}` placeholder is the only form a
            translator can work with.
           */}
          {formatMessage(
            `${noun} {current} ${resolveMessage(undefined, BASE_MESSAGES, "common.of")}`,
            {
              current: current + 1,
              total: pageCount,
            }
          )}
        </span>
      ) : null}
    </nav>
  );
});
