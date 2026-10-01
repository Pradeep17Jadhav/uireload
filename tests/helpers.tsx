/**
 * Test helpers.
 *
 * Exists so tests can be written with the same specifiers a consumer uses
 * (`uireload-test`) and so the library's direction and scheme contract is applied to
 * rendered markup rather than mocked in JavaScript.
 */

import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";

export interface WrapperOptions extends Omit<RenderOptions, "wrapper"> {
  /** Text direction for the rendered subtree. Defaults to `ltr`. */
  dir?: "ltr" | "rtl";
  /** Color scheme attribute, for verifying token-driven styling. */
  scheme?: "light" | "dark" | "high-contrast" | undefined;
  /** Density preset attribute. */
  density?: "compact" | "comfortable" | undefined;
}

/**
 * Renders `ui` inside a themed, direction-aware container.
 *
 * `dir` is applied to a real DOM node rather than mocked in JavaScript, because the
 * library resolves direction from the DOM. A mocked direction would mean RTL tests
 * never exercised the code path that matters.
 */
export function renderWithProviders(
  ui: ReactElement,
  { dir = "ltr", scheme, density, ...options }: WrapperOptions = {}
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <div
        dir={dir}
        {...(scheme ? { "data-uir-scheme": scheme } : {})}
        {...(density ? { "data-uir-density": density } : {})}
      >
        {children}
      </div>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
