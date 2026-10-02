/**
 * Release automation tests.
 *
 * A release cannot be re-run once its tag is pushed, so the two functions that
 * decide the version and rewrite the changelog are covered here rather than
 * discovered during a real release. The commit, tag and push steps are not
 * covered: they are irreversible by construction, and a test that exercised them
 * would itself be irreversible.
 */

import { describe, expect, it } from "vitest";
import { bump, releaseUnreleased } from "./release.mjs";

describe("bump", () => {
  it("increments the patch and leaves the rest alone", () => {
    expect(bump("0.1.0", "patch")).toBe("0.1.1");
    expect(bump("1.2.3", "patch")).toBe("1.2.4");
  });

  it("increments the minor and zeroes the patch", () => {
    // Zeroing is the part that matters. 0.1.9 -> 0.2.9 would place the next
    // patch above it, so 0.2.0 could never be released.
    expect(bump("0.1.0", "minor")).toBe("0.2.0");
    expect(bump("0.1.9", "minor")).toBe("0.2.0");
  });

  it("increments the major and zeroes minor and patch", () => {
    expect(bump("0.1.0", "major")).toBe("1.0.0");
    expect(bump("4.5.6", "major")).toBe("5.0.0");
  });

  it("refuses a version that is not MAJOR.MINOR.PATCH", () => {
    // A prerelease or a range has release rules of its own. Guessing would
    // produce a version nobody intended on a release that cannot be undone.
    expect(bump("1.0.0-rc.1", "patch")).toBeNull();
    expect(bump("^1.0.0", "minor")).toBeNull();
    expect(bump("1.0", "patch")).toBeNull();
    expect(bump("", "patch")).toBeNull();
  });

  it("refuses an unknown bump kind rather than defaulting to patch", () => {
    // Defaulting would ship a patch for someone who asked for a major, which is
    // the exact failure this whole script exists to prevent.
    expect(bump("1.0.0", "prerelease")).toBeNull();
  });

  it("does not confuse a digit inside a part for a separator", () => {
    expect(bump("1.0.10", "patch")).toBe("1.0.11");
    expect(bump("10.20.30", "minor")).toBe("10.21.0");
  });
});

describe("releaseUnreleased", () => {
  const body = "### Added\n\n- A thing.";

  it("releases the body under the new version and reopens Unreleased", () => {
    const result = releaseUnreleased(
      `# Changelog\n\n## [Unreleased]\n\n${body}\n`,
      "0.2.0",
      "2026-10-02"
    );

    expect(result).toBe(`# Changelog\n\n## [Unreleased]\n\n## [0.2.0] - 2026-10-02\n\n${body}\n`);
  });

  it("keeps the previous release below the one it released", () => {
    const result = releaseUnreleased(
      `## [Unreleased]\n\n${body}\n\n## [0.1.0] - 2026-09-01\n\n- Earlier.\n`,
      "0.2.0",
      "2026-10-02"
    );

    expect(result).toContain("## [0.2.0] - 2026-10-02");
    expect(result).toContain("## [0.1.0] - 2026-09-01");
    // Order is the assertion: a release inserted below an older one reads as if
    // it shipped earlier than it did.
    expect(result.indexOf("[0.2.0]")).toBeLessThan(result.indexOf("[0.1.0]"));
  });

  it("does not swallow the previous release's entries into the new one", () => {
    const result = releaseUnreleased(
      `## [Unreleased]\n\n${body}\n\n## [0.1.0] - 2026-09-01\n\n- Earlier.\n`,
      "0.2.0",
      "2026-10-02"
    );

    // Everything after the 0.1.0 heading must be untouched.
    const tail = result.slice(result.indexOf("## [0.1.0]"));
    expect(tail).toBe("## [0.1.0] - 2026-09-01\n\n- Earlier.\n");
  });

  it("handles the first release, where no version heading exists yet", () => {
    const result = releaseUnreleased(`## [Unreleased]\n\n${body}`, "0.1.0", "2026-10-02");

    expect(result).toBe(`## [Unreleased]\n\n## [0.1.0] - 2026-10-02\n\n${body}\n`);
  });

  it("returns null when Unreleased is empty", () => {
    // Releasing nothing would write a heading documenting a release with no
    // entries, which is worse than refusing.
    expect(releaseUnreleased("## [Unreleased]\n\n\n## [0.1.0] - x\n", "0.2.0", "d")).toBeNull();
    expect(releaseUnreleased("## [Unreleased]", "0.2.0", "d")).toBeNull();
  });

  it("returns null when there is no Unreleased heading", () => {
    expect(
      releaseUnreleased("# Changelog\n\n## [0.1.0] - x\n\n- Thing.\n", "0.2.0", "d")
    ).toBeNull();
  });

  it("keeps subheadings inside the released body", () => {
    // `###` is not a version heading. Matching it would cut the release in half
    // and leave Added in one version and Fixed in another.
    const full = `## [Unreleased]\n\n### Added\n\n- A.\n\n### Fixed\n\n- B.\n`;
    const result = releaseUnreleased(full, "0.2.0", "2026-10-02");

    expect(result).toContain("### Added\n\n- A.");
    expect(result).toContain("### Fixed\n\n- B.");
  });

  it("survives consecutive releases without nesting or losing one", () => {
    // Release twice, adding an entry under the reopened [Unreleased] in between,
    // exactly as a contributor would. The second must sit above the first and
    // neither entry may be dropped.
    const first = releaseUnreleased(`## [Unreleased]\n\n- One.\n`, "0.2.0", "d1");

    // `- Two.` goes directly under the reopened heading, not at the end of file.
    const withSecondEntry = first?.replace("## [Unreleased]\n\n", "## [Unreleased]\n\n- Two.\n\n");
    const second = releaseUnreleased(withSecondEntry, "0.3.0", "d2");

    expect(second).toContain("- Two.");
    expect(second).toContain("- One.");
    expect(second?.indexOf("[0.3.0]")).toBeLessThan(second?.indexOf("[0.2.0]") ?? -1);
    // The reopened heading stays above everything, and is empty again.
    expect(second?.startsWith("## [Unreleased]\n\n## [0.3.0]")).toBe(true);
  });
});
