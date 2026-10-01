/**
 * Event handler composition.
 *
 * Every component needs to run its own behaviour *and* let the consumer observe
 * the same event. The rule is fixed across the library so behaviour never depends
 * on which component you are using:
 *
 * > The consumer's handler runs first. If it calls `event.preventDefault()`, our
 * > internal behaviour is skipped entirely.
 *
 * Consumer-first is the only ordering that makes `preventDefault()` meaningful as
 * an opt-out. Running our handler first would mean the state already changed by
 * the time the consumer could veto it.
 *
 * `event.stopPropagation()` is left to the consumer; we do not inspect
 * `cancelBubble`, because the DOM already stops delivering the event and checking
 * it here only added a surprising code path.
 */

type MaybeHandler<E> = ((event: E) => void) | undefined;

/**
 * The only thing `composeHandlers` needs from an event.
 *
 * Structural rather than `extends Event`, because React's synthetic events do not
 * extend the DOM `Event` type even though they expose `preventDefault()`. Typing
 * against `Event` here would make the helper unusable with `onClick` and friends,
 * which is where it is needed most.
 */
export interface CancellableEvent {
  preventDefault(): void;
  defaultPrevented: boolean;
}

export interface ComposeOptions {
  /**
   * When `true`, skip our handler if the consumer's handler called
   * `preventDefault()`. Default `true`.
   */
  respectDefaultPrevented?: boolean;
}

export function composeHandlers<E extends CancellableEvent>(
  ourHandler: MaybeHandler<E>,
  consumerHandler: MaybeHandler<E>,
  { respectDefaultPrevented = true }: ComposeOptions = {}
): (event: E) => void {
  return (event: E) => {
    consumerHandler?.(event);

    if (respectDefaultPrevented && event.defaultPrevented) return;

    ourHandler?.(event);
  };
}
