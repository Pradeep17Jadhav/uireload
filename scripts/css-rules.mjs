/**
 * Pure CSS rule checks, separated from the CLI so they can be unit tested.
 *
 * `check-css.mjs` is the entry point; this module has no side effects.
 *
 * JSDoc types are used rather than TypeScript because this file is plain JavaScript:
 * it runs before the build, with no transpilation. They are still checked, because
 * the `*.test.ts` suite imports this module and inherits these types.
 */

/** One reported problem, with enough context to fix it without opening the file. */
export class CssViolation {
  /**
   * @param {string} file
   * @param {number} line 1-based
   * @param {string} message
   * @param {string} text the offending source line, trimmed
   */
  constructor(file, line, message, text) {
    this.file = file;
    this.line = line;
    this.message = message;
    this.text = text;
  }
}

/** Marker that suppresses the current line. */
export const DISABLE_MARKER = "uir-css-disable";

/**
 * property -> logical replacement. A property is rejected because the physical form
 * is wrong, not because the property itself is forbidden.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const PHYSICAL_PROPERTIES = {
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  "border-left": "border-inline-start",
  "border-right": "border-inline-end",
  "border-left-width": "border-inline-start-width",
  "border-right-width": "border-inline-end-width",
  "border-left-color": "border-inline-start-color",
  "border-right-color": "border-inline-end-color",
  "border-top-left-radius": "border-start-start-radius",
  "border-top-right-radius": "border-start-end-radius",
  "border-bottom-left-radius": "border-end-start-radius",
  "border-bottom-right-radius": "border-end-end-radius",
  left: "inset-inline-start",
  right: "inset-inline-end",
};

/**
 * Properties that are valid but whose *values* are wrong when physical.
 *
 * `text-align`, `float` and `clear` are deliberately absent from
 * {@link PHYSICAL_PROPERTIES}: listing them in both places would report one line
 * twice.
 *
 * @type {ReadonlyArray<{ property: string, bad: RegExp, good: string }>}
 */
export const VALUE_CHECKS = [
  { property: "text-align", bad: /\b(left|right)\b/i, good: "start / end" },
  { property: "float", bad: /\b(left|right)\b/i, good: "inline-start / inline-end" },
  { property: "clear", bad: /\b(left|right)\b/i, good: "inline-start / inline-end" },
];

/** Namespace every class selector in library CSS must carry. */
export const CLASS_PREFIX = "uir-";

/**
 * Strip block comments from a whole stylesheet, preserving line numbers.
 *
 * Each comment is replaced with one newline per line it spanned, so line indices still
 * correspond to the original source and error messages stay accurate.
 *
 * This has to run over the whole file rather than per line. A block comment that opens
 * on one line and closes on another cannot be matched line by line, so its prose gets
 * parsed as code. That produced a real false positive on the first component
 * stylesheet, whose comment quoted Fiori's generated CSS.
 *
 * @param {string} css
 * @returns {string}
 */
export function stripBlockComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => {
    const newlines = comment.match(/\n/g);
    return newlines === null ? "" : newlines.join("");
  });
}

/**
 * Strip constructs that can look like rules but are not, within a single line.
 *
 * Comments must already be gone; see {@link stripBlockComments}.
 *
 * @param {string} line
 * @returns {string}
 */
export function stripNonCode(line) {
  return line
    .replace(/@import[^;]+;/g, "")
    .replace(/url\([^)]*\)/g, "")
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''");
}

/**
 * Class selectors in a line, ignoring decimals.
 *
 * The leading-character guard keeps `.5rem` from parsing as the class `5rem`, and the
 * identifier-start guard keeps `1.5` out.
 *
 * @param {string} line code with comments and strings already stripped
 * @returns {string[]}
 */
export function classSelectors(line) {
  const found = [];
  const pattern = /(^|[^\w.-])\.([a-zA-Z_-][\w-]*)/g;

  let match;
  while ((match = pattern.exec(line)) !== null) {
    found.push(match[2]);
  }

  return found;
}

/**
 * Check one line of CSS.
 *
 * `line` should already have block comments stripped; see
 * {@link checkCss}, which does that for the whole file.
 *
 * @param {string} line
 * @param {{ suppressed?: boolean, prefix?: string }} [options]
 * @returns {CssViolation[]}
 */
export function checkLine(line, options = {}) {
  const { prefix = CLASS_PREFIX } = options;

  /*
   * Suppression is decided by the caller from the *original* line. The marker is
   * almost always written as a trailing comment, and by the time comments are
   * stripped it would be gone � which would silently disable every inline
   * suppression in the codebase.
   */
  if (options.suppressed === true) return [];

  const code = stripNonCode(line).trim();
  if (code === "") return [];

  /** @type {CssViolation[]} */
  const violations = [];

  const report = (message, text) =>
    violations.push(new CssViolation("", 0, message, text ?? line.trim()));

  // 1. Namespace. The isolation guarantee plain CSS depends on; without the prefix a
  //    single unprefixed class can collide with the host application.
  for (const name of classSelectors(code)) {
    if (!name.startsWith(prefix)) {
      report(
        `unnamespaced class selector \`.${name}\`; library classes must start with \`${prefix}\``,
        line
      );
    }
  }

  // 2. Physical direction properties.
  for (const [property, suggestion] of Object.entries(PHYSICAL_PROPERTIES)) {
    const pattern = new RegExp(`(^|[;{\\s])${property}\\s*:`, "i");
    if (pattern.test(code)) {
      report(`physical property \`${property}\`; use \`${suggestion}\` instead`);
    }
  }

  // 3. Physical direction values.
  for (const { property, bad, good } of VALUE_CHECKS) {
    const match = new RegExp(`(^|[;{\\s])${property}\\s*:([^;]*)`, "i").exec(code);
    if (match && bad.test(match[2])) {
      report(`physical value for \`${property}\`; use \`${good}\` instead`);
    }
  }

  // 4. Asymmetric box-shadow. An x-offset of exactly zero is symmetric and fine; any
  //    other magnitude mirrors in RTL, so its sign is not a safe way to move a shadow.
  //
  //    A single declaration may list several shadows. The list is symmetric if its
  //    x-offsets cancel, which is the idiomatic way to write a two-sided glow. Splitting
  //    on commas and summing is therefore correct here in a way it would not be for,
  //    say, `transition`.
  const shadow = /(^|[;{\s])box-shadow\s*:([^;]*)/i.exec(code);
  if (shadow) {
    const offsets = [
      ...shadow[2].matchAll(/(?:^|,)\s*(?:inset\s+)?(-?\d*\.?\d+)(px|rem|em)\s+(-?\d*\.?\d+)/gi),
    ];

    let xTotal = 0;
    let sawLayer = false;

    for (const offset of offsets) {
      sawLayer = true;
      xTotal += Number.parseFloat(offset[1]);
    }

    if (sawLayer && xTotal !== 0) {
      report(
        "asymmetric `box-shadow`: a non-zero net x-offset mirrors in RTL, so its sign means something different per direction. Use a symmetric shadow, or set one per `[dir]`.",
        line
      );
    }
  }

  return violations;
}

/**
 * Check a whole stylesheet.
 *
 * @param {string} source
 * @param {string} file path used in messages
 * @param {{ disableMarker?: string, prefix?: string }} [options]
 * @returns {CssViolation[]}
 */
export function checkCss(source, file, options = {}) {
  const { disableMarker = DISABLE_MARKER, prefix = CLASS_PREFIX } = options;

  /** @type {CssViolation[]} */
  const found = [];

  const original = source.split("\n");

  // Comments are stripped for the whole file first, with line numbers preserved, so a
  // multi-line comment's prose is never read as a rule.
  stripBlockComments(source)
    .split("\n")
    .forEach((line, index) => {
      // The marker is read from the original line, because it lives in a comment.
      const suppressed = (original[index] ?? "").includes(disableMarker);

      for (const violation of checkLine(line, { prefix, suppressed })) {
        violation.file = file;
        violation.line = index + 1;
        found.push(violation);
      }
    });

  return found;
}
