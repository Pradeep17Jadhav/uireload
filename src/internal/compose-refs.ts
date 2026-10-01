/**
 * Ref merging.
 *
 * Components must accept a `ref` from the consumer *and* keep an internal ref.
 * `composeRefs` lets an internal hook and the consumer's ref observe the same node
 * without either side knowing about the other.
 */

import type { Ref } from "react";

export type PossibleRef<T> = Ref<T> | undefined;

function assignRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref !== null && ref !== undefined) {
    // `RefObject.current` is readonly in the type system; the cast is the standard
    // escape hatch and is safe because React owns this object.
    (ref as { current: T | null }).current = value;
  }
}

/** Combine several refs into one callback ref. */
export function composeRefs<T>(...refs: PossibleRef<T>[]): (node: T | null) => void {
  return (node: T | null) => {
    for (const ref of refs) assignRef(ref, node);
  };
}
