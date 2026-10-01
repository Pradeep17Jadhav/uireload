/**
 * Message interpolation.
 *
 * This is the whole i18n design, deliberately. There is no provider, no context
 * and no runtime dependency on a translation library, because:
 *
 * 1. Components must be usable with zero setup. A required `<I18nProvider>` makes
 *    the first component unusable until the consumer configures something.
 * 2. Nested providers create hydration mismatches when a locale differs between
 *    server and client render.
 * 3. A component that takes its own `messages` prop is trivially testable and
 *    trivially composable; a component that reaches into ambient context is not.
 *
 * The trade-off, stated plainly: consumers pass `messages` per component instance.
 * That is more typing, and it buys full control over SSR, per-route locales,
 * partial translation, and zero provider-ordering constraints.
 */

/**
 * A component's message catalog.
 *
 * Keys are namespaced per component to avoid collisions when catalogs are merged
 * or spread. Values are plain strings: a component may safely split a message
 * across multiple DOM text nodes (needed for placeholders), which keeps each
 * fragment addressable and translatable in isolation.
 */
export interface Messages {
  readonly [key: string]: string;
}

/**
 * Placeholder tokens inside a message.
 *
 * `{count}` is substituted at render time. Braces are reserved: a literal brace
 * must be written `{{` and `}}`.
 */
export type MessageValues = Readonly<Record<string, string | number>>;

/**
 * Substitute values into a message template.
 *
 * Single-token scanner rather than chained regex replaces, so that a substituted
 * value containing braces is never re-interpreted as another placeholder or an
 * escape. Unknown placeholders are left verbatim instead of becoming
 * `undefined`: a missing value should be an obvious bug in development, not
 * text a user sees.
 */
export function formatMessage(template: string, values?: MessageValues): string {
  if (!values) return unescapeBraces(template);

  let out = "";
  let index = 0;

  while (index < template.length) {
    const char = template[index];

    if (char === "{") {
      // Escaped literal brace.
      if (template[index + 1] === "{") {
        out += "{";
        index += 2;
        continue;
      }

      const close = template.indexOf("}", index + 1);
      const key = close === -1 ? null : template.slice(index + 1, close);

      // A well-formed placeholder must be an identifier; anything else is a literal.
      if (key !== null && /^\w+$/.test(key)) {
        const value = values[key];
        out += value === undefined ? `{${key}}` : String(value);
        index = close + 1;
        continue;
      }

      out += char;
      index += 1;
      continue;
    }

    if (char === "}" && template[index + 1] === "}") {
      out += "}";
      index += 2;
      continue;
    }

    out += char;
    index += 1;
  }

  return out;
}

function unescapeBraces(template: string): string {
  return template.replace(/\{\{/g, "{").replace(/\}\}/g, "}");
}

/**
 * Resolve a message with a fallback, falling back per key.
 *
 * A component looks up `messages[namespace.key]` and falls back to
 * `defaults[namespace.key]`. Partial consumer catalogs are therefore valid, which
 * matters when a library adds a new message in a minor release: existing
 * translations keep working and only the new key needs translating.
 */
export function resolveMessage(
  messages: Messages | undefined,
  defaults: Messages,
  key: string
): string {
  const provided = messages?.[key];
  return typeof provided === "string" && provided.length > 0 ? provided : (defaults[key] as string);
}
