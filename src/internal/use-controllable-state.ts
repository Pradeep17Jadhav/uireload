/**
 * Uncontrolled / controlled state.
 *
 * Almost every interactive UIReload component needs the same shape:
 *
 *   const [open, setOpen] = useControllableState({
 *     value: openProp,
 *     defaultValue: defaultOpen,
 *     onChange: setOpenProp,
 *   });
 *
 * Rules baked in here so every component behaves identically:
 *
 * - `value === undefined` means uncontrolled.
 * - The setter identity never changes, so it is safe in effect dependency arrays.
 * - `onChange` fires only when the value actually changes (`Object.is` comparison,
 *   matching React's own semantics).
 * - Switching controlled <-> uncontrolled keeps the last observed value rather
 *   than snapping back to `defaultValue`, which avoids surprise UI jumps.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface ControllableStateOptions<T> {
  /** Controlled value. `undefined` switches the component to uncontrolled mode. */
  value?: T | undefined;
  /** Initial value used only in uncontrolled mode. */
  defaultValue?: T | undefined;
  /** Notified on every intentional change, controlled or not. */
  onChange?: ((value: T) => void) | undefined;
}

export type ControllableState<T> = [T, Dispatch<SetStateAction<T>>];

/**
 * Type guard for the functional form of `setState`.
 *
 * A bare `typeof action === "function"` does not narrow `T | ((prev: T) => T)` when
 * `T` is unconstrained, because `T` itself might be a function type. An explicit
 * guard states the intent and keeps the setter's parameter typed.
 */
function isUpdater<T>(action: SetStateAction<T>): action is (previous: T) => T {
  return typeof action === "function";
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): ControllableState<T> {
  const isControlled = value !== undefined;

  // `defaultValue as T` is the standard escape hatch: callers may legitimately omit
  // `defaultValue` for an optional state, and `undefined` is a valid `T`.
  const [uncontrolled, setUncontrolled] = useState<T>(() => defaultValue as T);
  const resolved = isControlled ? (value as T) : uncontrolled;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Mirror of the resolved value so the stable setter always reads the latest value
  // without needing it in its own dependency list.
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;

  /*
   * Controlled -> uncontrolled is the one transition that needs an effect. The last
   * controlled value becomes the uncontrolled value, so releasing control does not
   * snap the UI back to `defaultValue`. In an effect rather than during render so
   * the switch is not visible as an intermediate frame.
   */
  const lastControlledRef = useRef<T | undefined>(undefined);
  const wasControlledRef = useRef(isControlled);

  if (isControlled && value !== undefined) lastControlledRef.current = value;

  useEffect(() => {
    if (wasControlledRef.current && !isControlled && lastControlledRef.current !== undefined) {
      setUncontrolled(lastControlledRef.current);
    }
    wasControlledRef.current = isControlled;
  }, [isControlled]);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      const current = resolvedRef.current;
      const next = isUpdater(action) ? action(current) : action;

      if (Object.is(next, current)) return;

      resolvedRef.current = next;

      // Internal state only matters while uncontrolled. A controlled component is
      // expected to push `value` back down; when it does not, we deliberately do not
      // fight it, so React stays the single source of truth.
      if (value === undefined) {
        setUncontrolled(next);
      }

      onChangeRef.current?.(next);
    },
    [value]
  );

  return [resolved, setValue];
}
