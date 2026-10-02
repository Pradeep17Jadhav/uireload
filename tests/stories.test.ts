/**
 * Storybook hygiene.
 *
 * These are the rules that keep a story a faithful preview of the published package.
 * None of them fails today; they exist because each one has already been got wrong.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

/** Every `*.stories.tsx` outside the authoring template. */
function libraryStories(): string[] {
  const dir = join(root, "src", "components");
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;

    for (const file of readdirSync(join(dir, entry.name))) {
      if (file.endsWith(".stories.tsx")) found.push(join(dir, entry.name, file));
    }
  }

  return found;
}

describe("story stylesheets", () => {
  /**
   * `.storybook/preview.tsx` imports the assembled `dist/index.css`, which is what a
   * consumer loads. A story that also imports its own stylesheet looks correct while
   * depending on an import a consumer will not have.
   *
   * The real cost is the inverse: a story that imports only its *own* CSS silently loses
   * everything it composes. `toggle-button-group` rendered three unstyled grey buttons
   * because `Button`'s stylesheet was never loaded. The bundled stylesheet hides exactly
   * that class of mistake in production, so the story is the only place it shows up — and
   * the only place it can be caught.
   */
  it("does not import a stylesheet directly", () => {
    const offenders = libraryStories().filter((file) =>
      /^import\s+"\.\/[a-z-]+\.css";$/m.test(readFileSync(file, "utf8"))
    );

    expect(
      offenders,
      `these stories import their own CSS, so they will not reflect the published ` +
        `stylesheet: ${offenders.join(", ")}`
    ).toEqual([]);
  });

  it("has a preview that loads the assembled stylesheet", () => {
    const preview = readFileSync(join(root, ".storybook", "preview.tsx"), "utf8");

    // The assembled stylesheet, not a source file: layer order is the bundler's job, and
    // a story must show the result of that ordering rather than reimplement it.
    expect(preview).toContain('import "../dist/index.css"');
  });

  it("rebuilds the stylesheet before Storybook starts", () => {
    const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts as Record<
      string,
      string
    >;

    for (const name of ["storybook", "build-storybook"]) {
      expect(scripts[name], `${name} must build the CSS first`).toContain("build:css");
    }
  });
});

describe("component stories", () => {
  it("declares the shared control vocabulary in its controls", () => {
    /*
     * A story whose controls offer values the component does not accept teaches the wrong
     * API. The option lists are the contract a reader copies, so they are checked against
     * the values the component actually takes.
     */
    const expectations: Array<[string, RegExp[]]> = [
      [
        "button/button.stories.tsx",
        [/ghost.*outline.*solid/s, /neutral.*accent.*positive.*danger/s],
      ],
      [
        "icon-button/icon-button.stories.tsx",
        [/ghost.*outline.*solid/s, /neutral.*accent.*positive.*danger/s],
      ],
      [
        "toggle-button/toggle-button.stories.tsx",
        [/ghost.*outline.*solid/s, /neutral.*accent.*positive.*danger/s],
      ],
      [
        "toggle-button-group/toggle-button-group.stories.tsx",
        [/ghost.*outline.*solid/s, /neutral.*accent.*positive.*danger/s],
      ],
      [
        "textbox/textbox.stories.tsx",
        [
          /ghost.*outline.*solid/s,
          /neutral.*accent.*positive.*danger/s,
          /text.*email.*number.*password.*search.*tel.*url/s,
        ],
      ],
    ];

    for (const [relative, patterns] of expectations) {
      const source = readFileSync(join(root, "src", "components", relative), "utf8");

      for (const pattern of patterns) {
        expect(source, `${relative} does not offer the shared option list ${pattern}`).toMatch(
          pattern
        );
      }
    }
  });

  it("names every IconButton in the story, directly or through args", () => {
    /*
     * IconButton has no `label` prop, so `aria-label` is the only way to name it. A story
     * that omits it teaches the one mistake the component cannot prevent.
     *
     * A tag that spreads `{...args}` inherits the name from the story's `args`, so that
     * counts � but only if `args` really does declare one, which is asserted separately.
     */
    const source = readFileSync(
      join(root, "src", "components", "icon-button", "icon-button.stories.tsx"),
      "utf8"
    );

    const rendered = source.match(/<IconButton\b[^>]*>/g) ?? [];
    const unnamed = rendered.filter(
      (tag) => !tag.includes("aria-label") && !tag.includes("{...args}")
    );

    expect(rendered.length, "no IconButton found in the story file").toBeGreaterThan(0);
    expect(
      unnamed,
      `these <IconButton> tags have no accessible name: ${unnamed.join(" ")}`
    ).toEqual([]);
  });

  it("declares an accessible name in the IconButton story args", () => {
    const source = readFileSync(
      join(root, "src", "components", "icon-button", "icon-button.stories.tsx"),
      "utf8"
    );

    // Required, and documented as such in the component README. The spread in most of the
    // story's tags is only correct because this exists.
    expect(source).toMatch(/"aria-label":\s*"[^"]+"/);
  });
});
