/**
 * Release automation.
 *
 * One command per bump type:
 *
 *   npm run release:patch | release:minor | release:major
 *
 * Each does the whole sequence, in this order, and stops at the first failure:
 *
 *   1. Bump the version in package.json and package-lock.json (`npm version`).
 *   2. Move [Unreleased] in CHANGELOG.md under a dated heading for the new
 *      version, and open a fresh empty [Unreleased] above it.
 *   3. Run `verify`, so the commit that carries the version is one that passes
 *      the same gate CI applies.
 *   4. Commit and tag `v<version>`.
 *   5. Push the commit and the tag, which is what triggers the publish.
 *
 * Publishing itself happens in `.github/workflows/release.yml`, not here. That is
 * not a convenience: `publishConfig.provenance` is set, and npm only mints
 * Sigstore attestations from a supported CI provider on a cloud-hosted runner.
 * A local `npm publish` cannot produce provenance, so running it here would
 * either fail or silently ship an unattested package. Pushing the tag is how the
 * release reaches npm, with provenance.
 *
 * The guards exist because npm versions are immutable. Once a version is
 * published it cannot be replaced, only deprecated or unpublished, and both are
 * worse than not shipping. Every check that can catch a mistake runs before the
 * tag is pushed, not after.
 */

import { execFileSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const BUMP_KINDS = ["patch", "minor", "major"];

// ------------------------------------------------------------------ pure --
// Exported so `scripts/release.test.ts` can cover them. The destructive half of a
// release cannot be re-run once a tag is pushed, so the parts that can be
// checked without side effects are checked.

/**
 * Computes the next version.
 *
 * Only `MAJOR.MINOR.PATCH` is accepted. A prerelease or a range returns `null`
 * rather than a guess, because a bump computed from a version shape we did not
 * anticipate is a version nobody intended on a release that cannot be undone.
 */
export function bump(version, kind) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return null;

  const [major, minor, patch] = match.slice(1).map(Number);

  switch (kind) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return null;
  }
}

/**
 * Rewrites CHANGELOG.md: releases the body under `[Unreleased]` as the new
 * version, and opens a fresh empty `[Unreleased]` above it.
 *
 * Returns `null` when there is no `[Unreleased]` heading or its body is empty, so
 * the caller aborts with a message rather than writing a file that documents a
 * release that did not happen.
 */
export function releaseUnreleased(changelog, version, date) {
  const match = /^## \[Unreleased\][^\S\n]*$/m.exec(changelog);
  if (!match) return null;

  // Everything above the heading is prose and is kept verbatim.
  const prefix = changelog.slice(0, match.index);

  // Everything between the heading and the next version heading is what ships.
  const rest = changelog.slice(match.index + match[0].length);
  const nextHeading = rest.search(/^## \[/m);
  const released = (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
  if (!released) return null;

  // The tail, starting at its own heading, is untouched. Taking it from the
  // heading rather than from trimmed text keeps its leading spacing intact.
  const tail = nextHeading === -1 ? "" : rest.slice(nextHeading);

  /*
   * The heading is rebuilt rather than appended to. Prefixing the new heading onto
   * the old one leaves the old `[Unreleased]` in place with the released body still
   * under it, which produces two headings and a release that documents itself twice.
   */
  return (
    prefix +
    `## [Unreleased]\n\n## [${version}] - ${date}\n\n` +
    released +
    // No trailing blank block when this was the first release and there is no
    // older version below to separate from.
    (tail.trim() ? "\n\n" + tail.trimEnd() + "\n" : "\n")
  );
}

// --------------------------------------------------------------- helpers --

const step = (message) => console.log(`\n[1m> ${message}[0m`);
const info = (message) => console.log(`  ${message}`);
const shell = process.platform === "win32";

/** Runs a command, aborting the release if it fails. Streamed so progress is visible. */
function run(command, args, cwd) {
  info(`$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd, stdio: "inherit", shell });
}

/** Captures stdout, or returns `null` if the command fails. For probes that may legitimately fail. */
function tryRun(command, args, cwd) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      shell,
    }).trim();
  } catch {
    return null;
  }
}

function git(args, cwd) {
  return execSync(`git ${args}`, { cwd, encoding: "utf8" }).trim();
}

function abort(message) {
  console.error(`\n[31mRelease aborted: ${message}[0m\n`);
  process.exit(1);
}

function repoSlug(pkg) {
  const url = pkg.repository?.url ?? "";
  return url
    .replace(/^git\+/, "")
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/\.git$/, "");
}

// ------------------------------------------------------------------ main --

function main() {
  const args = process.argv.slice(2);
  const kind = args.find((arg) => BUMP_KINDS.includes(arg));
  const dryRun = args.includes("--dry-run");
  const skipVerify = args.includes("--skip-verify");
  const skipPush = args.includes("--no-push");

  if (!kind) {
    console.error("usage: node scripts/release.mjs <patch|minor|major> [flags]");
    console.error("flags: --dry-run  --skip-verify  --no-push");
    process.exit(1);
  }

  /*
   * Resolved here, not at module scope. Vitest rewrites `import.meta.url` to its own
   * virtual path, so a module-level `new URL("../package.json", import.meta.url)` throws
   * "The URL must be of scheme file" when the tests import this file. Resolving inside
   * `main` keeps the pure exports above importable, and `..` is what walks up out of
   * `scripts/` to the repo root.
   */
  const ROOT = fileURLToPath(new URL("..", import.meta.url));
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const changelogPath = new URL("../CHANGELOG.md", import.meta.url);

  step(`Preparing a ${kind} release${dryRun ? " (dry run)" : ""}`);

  // 1. Guards. Every one of these is a mistake that is cheap to prevent and
  // expensive to discover after publishing.

  // A dirty tree means the version bump would be committed alongside unrelated
  // edits, so the tag would describe a commit that is more than the release.
  const status = git("status --porcelain", ROOT);
  if (status) {
    abort(
      "the working tree has uncommitted changes. Commit or stash them first:\n" +
        status
          .split("\n")
          .map((line) => `      ${line}`)
          .join("\n")
    );
  }

  const branch = git("rev-parse --abbrev-ref HEAD", ROOT);
  if (branch !== "main") {
    abort(`on branch "${branch}". Releases are cut from main.`);
  }

  const next = bump(pkg.version, kind);
  if (!next) {
    abort(`cannot bump "${pkg.version}" by ${kind}. It is not MAJOR.MINOR.PATCH.`);
  }

  // An existing tag means a retry, or that this version was already released.
  // Re-pushing a moved tag publishes code that does not match the version
  // consumers already resolved.
  const tag = `v${next}`;
  if (git(`tag --list ${tag}`, ROOT) === tag) {
    abort(`tag ${tag} already exists. If this is a retry, delete it: git tag -d ${tag}`);
  }

  // If the version is already on the registry the publish will fail, and the
  // changelog would claim a release that did not happen.
  if (tryRun("npm", ["view", `${pkg.name}@${next}`, "version"], ROOT)) {
    abort(`${pkg.name}@${next} is already published to the registry.`);
  }

  // Refuse to ship a changelog entry that documents nothing.
  const changelog = readFileSync(changelogPath, "utf8");
  const updated = releaseUnreleased(changelog, next, new Date().toISOString().slice(0, 10));
  if (!updated) {
    abort(
      /## \[Unreleased\]/.test(changelog)
        ? "`## [Unreleased]` is empty. A release with nothing under it documents nothing.\n" +
            "  Add the entries for this release, then run the command again."
        : "CHANGELOG.md has no `## [Unreleased]` heading to release from."
    );
  }

  if (dryRun) {
    step("Would do");
    info(`version   ${pkg.version} -> ${next} (${kind})`);
    info(`changelog release [Unreleased] as [${next}], reopen [Unreleased]`);
    info(`verify    ${skipVerify ? "skipped" : "npm run verify"}`);
    info(`commit    release ${next}`);
    info(`tag       ${tag}`);
    if (!skipPush) info("push      origin main --follow-tags, which triggers the publish");
    console.log("\nDry run only. Nothing was changed.\n");
    return;
  }

  // 2. Version. `npm version` rather than a hand edit, because it is the only
  // thing that keeps package-lock.json's two version fields consistent with
  // package.json. Editing package.json alone leaves the lockfile claiming a
  // version the tarball does not have.
  step(`Bumping version ${pkg.version} -> ${next}`);
  run("npm", ["version", next, "--no-git-tag-version", "--allow-same-version"], ROOT);

  // 3. Changelog.
  step("Updating CHANGELOG.md");
  writeFileSync(changelogPath, updated);
  info(`## [${next}] dated, ## [Unreleased] reopened`);
  // Formatting is enforced by verify, so fix what we just wrote rather than
  // failing a later step for it.
  run("npx", ["prettier", "--write", "CHANGELOG.md"], ROOT);

  // 4. Verify, so the tagged commit is one that passes the gate CI applies.
  if (skipVerify) {
    step("Skipping verify (--skip-verify)");
    console.warn(
      "  Warning: the tagged commit is unverified. CI re-runs verify before\n" +
        "  publishing, so a failure will surface there instead of here."
    );
  } else {
    step("Running verify");
    run("npm", ["run", "verify"], ROOT);
  }

  // 5. Commit and tag.
  step(`Committing and tagging ${tag}`);
  run("git", ["add", "package.json", "package-lock.json", "CHANGELOG.md"], ROOT);
  run("git", ["commit", "-m", `release ${next}`], ROOT);
  run("git", ["tag", "-a", tag, "-m", next], ROOT);
  info(`${tag} -> ${git("rev-parse HEAD", ROOT)}`);

  // 6. Publish, by pushing the tag the Release workflow watches.
  if (skipPush) {
    step("Not pushing (--no-push)");
    console.log(`\n  ${tag} is local only. To publish it:\n`);
    console.log("    git push origin main --follow-tags\n");
    return;
  }

  step("Pushing, which triggers the publish");
  // The tag is what the workflow watches. Pushing the commit alone would leave
  // the release unpublished while looking like it had been attempted.
  run("git", ["push", "origin", "main", "--follow-tags"], ROOT);

  console.log(`\n[32m${pkg.name}@${next} released.[0m`);
  console.log(`  Pushed ${tag}. The Release workflow publishes it with provenance.`);
  console.log(`  Watch: https://github.com/${repoSlug(pkg)}/actions/workflows/release.yml\n`);
}

// Only when invoked as a script. Importing it, as the tests do, must not bump a
// version or push a tag.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
