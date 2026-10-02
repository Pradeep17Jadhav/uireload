/**
 * ToggleButtonGroup.
 *
 * This component exists to make one accessibility decision correctly, and it is commonly
 * made incorrectly: a `<div>` with **no role at all** announces its members as loose buttons with
 * no indication that they are one control.
 *
 * Other designs are better but stop short: they use item navigation for arrow-key movement, so
 * the group behaves like a single widget, but their exposed surface does not promise a role either.
 *
 * So UIReload splits by selection mode, because the two cases have genuinely
 * different correct answers:
 *
 * | Mode       | Group        | Member   | State          | Keyboard                        |
 * | ---------- | ------------ | -------- | -------------- | ------------------------------- |
 * | `single`   | `radiogroup` | `radio`  | `aria-checked` | Roving tabindex, arrows select  |
 * | `multiple` | `group`      | `button` | `aria-pressed` | Each member its own tab stop     |
 *
 * "Choose exactly one" is the APG radio-group pattern, and `radio` + `aria-checked`
 * is the only correct expression of it. There is no APG pattern for multiple
 * selection, so individually-tabbable pressed buttons are the right answer there.
 */

import { Children, isValidElement, useEffect, useRef, type ReactElement } from "react";
import {
  composeHandlers,
  composeRefs,
  cx,
  useControllableState,
  useRovingFocus,
} from "../../internal";
import { ToggleButton } from "../toggle-button";

import type { SelectionMode, ToggleButtonGroupProps } from "./toggle-button-group.types";

/**
 * Finds the group's members without needing a marker attribute on them: in single mode
 * the members are radios, in multiple mode they are buttons. Either way they are the
 * group's direct focusable children.
 */
const ITEM_SELECTOR = '[role="radio"], [role="button"]';

interface MemberProps {
  value?: string | undefined;
  pressed?: boolean | undefined;
  defaultPressed?: boolean | undefined;
  disabled?: boolean | undefined;
  onKeyDown?: ((event: React.KeyboardEvent<HTMLButtonElement>) => void) | undefined;
  onClick?: ((event: React.MouseEvent<HTMLButtonElement>) => void) | undefined;
}

export function ToggleButtonGroup(props: ToggleButtonGroupProps) {
  const {
    label,
    orientation = "horizontal",
    size = "md",
    variant = "outline",
    tone = "neutral",
    disabled = false,
    className,
    children,
    ref,
    /*
     * Destructured rather than read as `props.selectionMode` and friends, so they are
     * removed from `rest` and cannot reach the DOM.
     *
     * Leaving them in `rest` emitted `<div selectionmode="single">`: React lowercases an
     * unrecognised camelCase attribute and passes it straight through, so the DOM
     * carried a meaningless attribute and React logged an unknown-prop warning. Caught
     * by inspecting the rendered markup in Storybook, not by any assertion.
     */
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    ...rest
  } = props;

  const mode: SelectionMode = selectionMode ?? "single";
  const isSingle = mode === "single";

  /*
   * Both modes reduce to one `useControllableState` over a normalised value, so the
   * selection logic below has a single code path. The public types stay precise
   * through the discriminated union in `toggle-button-group.types.ts`, which makes
   * "array with single mode" a compile error rather than a runtime surprise.
   */
  const [selection, setSelection] = useControllableState<string | string[] | null>({
    /*
     * `undefined` must be forwarded as `undefined`, not normalised to `null`.
     * `useControllableState` treats `undefined` as "uncontrolled"; coercing it to
     * `null` makes the group permanently controlled with nothing selected, which
     * silently ignores `defaultValue`. `null` is forwarded when the consumer actually
     * passes it, where it correctly means "controlled, nothing selected".
     */
    value,
    defaultValue: defaultValue ?? (isSingle ? null : []),
    onChange: (next) => {
      // Narrowed here, at the boundary, so each consumer callback receives exactly the
      // shape its own `selectionMode` promised.
      const handler = onValueChange as ((next: unknown) => void) | undefined;
      if (isSingle) handler?.(next === null ? null : next);
      else handler?.(next ?? []);
    },
  });

  const selected: string[] = isSingle
    ? typeof selection === "string" && selection.length > 0
      ? [selection]
      : []
    : ((selection as string[]) ?? []);

  const isPressed = (value: string | undefined): boolean =>
    value !== undefined && selected.includes(value);

  const select = (value: string | undefined): void => {
    if (value === undefined) return;

    if (isSingle) {
      /*
       * A radio cannot be unchecked by pressing it. That is APG radio-group behaviour
       * and the reason single mode uses `role="radio"` rather than pressed buttons.
       */
      setSelection(value);
      return;
    }

    setSelection(
      selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value]
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const { handleKeyDown } = useRovingFocus({
    orientation: orientation === "vertical" ? "vertical" : "horizontal",
    loop: true,
    itemSelector: ITEM_SELECTOR,
    /*
     * The APG radio-group pattern requires selection to follow focus. A focus helper
     * cannot assume a consumer wants that, so it is opt-in and supplied here. In
     * multiple mode there is no selection-follows-focus, and passing the callback
     * would make arrow keys check items, which is wrong for a set of toggles.
     */
    onNavigate: isSingle
      ? (index) => {
          const items = containerRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
          const value = items?.[index]?.dataset["uirValue"];
          if (value !== undefined) setSelection(value);
        }
      : undefined,
  });

  /*
   * A group of buttons with no accessible name is announced only as "group", with no
   * indication of what it groups. Warns in development; never throws, because a
   * consumer who labelled it via `aria-labelledby` on a nested element has satisfied
   * the requirement.
   */
  /*
   * Extracted so the dependency array holds plain identifiers. Reading `rest["aria-*"]`
   * inside the array is a computed expression, which the exhaustive-deps rule cannot
   * check statically, and `rest` itself is a new object on every render, which would
   * make the effect fire constantly.
   */
  const ariaLabel = rest["aria-label"];
  const ariaLabelledBy = rest["aria-labelledby"];

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (label === undefined && ariaLabel === undefined && ariaLabelledBy === undefined) {
        console.warn(
          "ToggleButtonGroup: no accessible name. Pass `label`, `aria-label` or " +
            '`aria-labelledby`. A group of buttons with no name is announced only as "group".'
        );
      }
    }
  }, [label, ariaLabel, ariaLabelledBy]);

  const members = Children.toArray(children).filter(isValidElement) as ReactElement<MemberProps>[];

  /*
   * Members must be `ToggleButton` elements passed directly.
   *
   * The group rebuilds each member rather than rendering `children` as-is, so it needs
   * each member's `value` — which only a `ToggleButton` prop can supply. A child that is
   * a *component* (`<Members />`) or a fragment wraps the real buttons one level deeper,
   * and this collapses them into a single valueless button with an empty label. That is
   * silent and looks like a rendering bug rather than a usage error, so it is made loud.
   *
   * Context would remove the constraint entirely, and is the right answer at some point.
   * It is not v1: cloning children is the common approach, and it silently mishandles a wrapped
   * child in exactly this fashion.
   * Recorded in `docs/roadmap.md`.
   */
  if (process.env.NODE_ENV !== "production") {
    for (const child of members) {
      if (child.type !== ToggleButton) {
        const name =
          typeof child.type === "string"
            ? `<${child.type}>`
            : ((child.type as { displayName?: string; name?: string }).displayName ??
              (child.type as { name?: string }).name ??
              "a component");

        console.error(
          `ToggleButtonGroup: every child must be a <ToggleButton>, but found ${name}. ` +
            "The group reads each member's `value` to manage selection, and a child that " +
            "wraps the buttons hides it. Pass the ToggleButtons directly — " +
            "`{items.map(i => <ToggleButton key={i.value} value={i.value}>{i.label}</ToggleButton>)}` — rather " +
            "than a component or fragment that returns them."
        );
      }
    }
  }

  /*
   * Where the single tab stop sits. Derived, not stored: the selected member holds it,
   * or the first member when nothing is selected yet, so Tab always has exactly one
   * entry point into the group.
   */
  const anyPressed = members.some((child) => isPressed(child.props.value));

  return (
    <div
      {...rest}
      ref={composeRefs(containerRef, ref)}
      className={cx("uir-toggle-button-group", className)}
      data-orientation={orientation}
      data-selection-mode={mode}
      // Single selection is "choose exactly one": a radiogroup. Multiple selection has
      // no APG equivalent, so it stays a group of individually-tabbable buttons.
      role={isSingle ? "radiogroup" : "group"}
      aria-label={label ?? rest["aria-label"]}
      /*
       * `aria-orientation` only in single mode.
       *
       * `radiogroup` supports it; `group` does not, and axe reports
       * `aria-allowed-attr` (critical) when it appears on a `group`. Found by
       * `tests/accessibility.test.tsx`, which is the argument for having that test.
       *
       * Also redundant while horizontal, which is the default, so it is emitted only
       * when it actually says something.
       */
      aria-orientation={isSingle && orientation === "vertical" ? "vertical" : undefined}
    >
      {members.map((child, index) => {
        const value = child.props.value;

        const overrides: Record<string, unknown> = {
          role: isSingle ? "radio" : "button",
          /*
           * The group's selection wins over the member's own `pressed` /
           * `defaultPressed`. Inside a group, selection is the *group's* concern —
           * that is the whole reason the group exists — so a member's local state is
           * ignored rather than merged, which would let the two disagree.
           */
          pressed: isPressed(value),
          disabled: disabled || child.props.disabled,
          "data-uir-value": value,
          // Read back by `useRovingFocus`'s `onNavigate`, and by consumer CSS to style
          // the seams between members.
          "data-grouped": "",
          /*
           * Passed as real props, not as `data-*`. `ToggleButton` derives its own
           * `data-size` from the `size` prop, so setting `data-size` directly would be
           * overwritten by that derivation and silently ignored.
           */
          size,
          variant,
          tone,
        };

        if (isSingle) {
          overrides["tabIndex"] = isPressed(value) || (!anyPressed && index === 0) ? 0 : -1;
          overrides["onKeyDown"] = composeHandlers(handleKeyDown, child.props.onKeyDown);
        }

        overrides["onClick"] = composeHandlers((event: React.MouseEvent<HTMLButtonElement>) => {
          if (disabled || child.props.disabled) {
            event.preventDefault();
            return;
          }
          select(value);
        }, child.props.onClick);

        return (
          <ToggleButton key={child.key ?? value ?? index} {...overrides} ref={undefined}>
            {(child.props as { children?: React.ReactNode }).children}
          </ToggleButton>
        );
      })}
    </div>
  );
}
