import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

// Relative, unlike a published component's test. This folder is deliberately not in
// the export map, so `uireload/components/example` does not resolve. Change this line
// when you copy the folder.
import { Example } from "./example";

describe("Example (template)", () => {
  it("renders its children and forwards native attributes", () => {
    render(
      <Example data-testid="root" id="my-example">
        content
      </Example>
    );

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("id", "my-example");
    expect(root).toHaveTextContent("content");
  });

  it("merges a consumer className rather than replacing ours", () => {
    render(<Example data-testid="root" className="consumer-class" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveClass("uir-example");
    expect(root).toHaveClass("consumer-class");
  });

  it("exposes state through data attributes, not class names", () => {
    render(<Example data-testid="root" defaultOpen />);

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("data-state", "open");
    expect(root.className).not.toMatch(/state/);
  });

  it("switches state on interaction", async () => {
    const user = userEvent.setup();
    render(<Example data-testid="root" />);

    await user.click(screen.getByTestId("root"));
    expect(screen.getByTestId("root")).toHaveAttribute("data-state", "open");

    await user.click(screen.getByTestId("root"));
    expect(screen.getByTestId("root")).toHaveAttribute("data-state", "closed");
  });

  it("stays controlled when `open` is provided", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Example data-testid="root" open={false} onOpenChange={onOpenChange} />);

    await user.click(screen.getByTestId("root"));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    // React remains the source of truth: we report, the consumer decides.
    expect(screen.getByTestId("root")).toHaveAttribute("data-state", "closed");
  });

  it("lets a consumer prevent the default behaviour", async () => {
    const user = userEvent.setup();
    render(<Example data-testid="root" onClick={(event) => event.preventDefault()} />);

    await user.click(screen.getByTestId("root"));
    expect(screen.getByTestId("root")).toHaveAttribute("data-state", "closed");
  });

  it("still calls the consumer handler when it prevents the default", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(<Example data-testid="root" onClick={onClick} />);

    await user.click(screen.getByTestId("root"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("marks itself disabled for assistive technology", () => {
    render(<Example data-testid="root" disabled />);
    expect(screen.getByTestId("root")).toHaveAttribute("aria-disabled", "true");
  });

  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    render(<Example data-testid="root" disabled />);

    await user.click(screen.getByTestId("root"));
    expect(screen.getByTestId("root")).toHaveAttribute("data-state", "closed");
  });

  it("forwards its ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Example ref={ref} data-testid="root" />);

    expect(ref.current).toBe(screen.getByTestId("root"));
  });

  it("applies size as a data attribute so CSS owns the styling", () => {
    render(<Example data-testid="root" size="lg" />);
    expect(screen.getByTestId("root")).toHaveAttribute("data-size", "lg");
  });

  it("defaults size to md", () => {
    render(<Example data-testid="root" />);
    expect(screen.getByTestId("root")).toHaveAttribute("data-size", "md");
  });
});

/*
 * Direction and scheme coverage.
 *
 * Every component suite must include at least one RTL case. The direction is applied to
 * a real DOM node, because the library resolves it from the DOM; a mocked direction
 * would let a component pass while still being broken on a real RTL page.
 */
describe("Example (template) direction and scheme", () => {
  it("renders inside an RTL subtree", () => {
    renderWithProviders(<Example data-testid="root" />, { dir: "rtl" });

    const host = screen.getByTestId("root").parentElement as HTMLElement;
    expect(host).toHaveAttribute("dir", "rtl");
    expect(screen.getByTestId("root")).toHaveAttribute("data-state", "closed");
  });

  it("applies the color scheme attribute to a real node", () => {
    renderWithProviders(<Example data-testid="root" />, { scheme: "high-contrast" });

    const host = screen.getByTestId("root").parentElement as HTMLElement;
    expect(host).toHaveAttribute("data-uir-scheme", "high-contrast");
  });

  it("applies the density attribute to a real node", () => {
    renderWithProviders(<Example data-testid="root" />, { density: "compact" });

    const host = screen.getByTestId("root").parentElement as HTMLElement;
    expect(host).toHaveAttribute("data-uir-density", "compact");
  });

  it("behaves identically under RTL", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Example data-testid="root" />, { dir: "rtl" });

    await user.click(screen.getByTestId("root"));
    expect(screen.getByTestId("root")).toHaveAttribute("data-state", "open");
  });
});
