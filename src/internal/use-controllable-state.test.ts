import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "./use-controllable-state";

describe("useControllableState", () => {
  it("uses defaultValue when uncontrolled", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: "a" }));

    expect(result.current[0]).toBe("a");
  });

  it("updates internal state when uncontrolled", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 0 }));

    act(() => result.current[1](1));
    expect(result.current[0]).toBe(1);
  });

  it("accepts a value updater function", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 1 }));

    act(() => result.current[1]((previous) => previous + 1));
    expect(result.current[0]).toBe(2);
  });

  it("does not update internal state when controlled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ value: 0, onChange }));

    act(() => result.current[1](5));

    expect(onChange).toHaveBeenCalledWith(5);
    expect(result.current[0]).toBe(0);
  });

  it("keeps a stable setter identity across renders", () => {
    const { result, rerender } = renderHook(() => useControllableState({ defaultValue: 0 }));
    const first = result.current[1];

    rerender();
    expect(result.current[1]).toBe(first);
  });

  it("ignores changes that do not alter the value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 1, onChange }));

    act(() => result.current[1](1));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange for every real change", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 0, onChange }));

    act(() => result.current[1](1));
    act(() => result.current[1](2));

    expect(onChange).toHaveBeenNthCalledWith(1, 1);
    expect(onChange).toHaveBeenNthCalledWith(2, 2);
  });

  it("uses the latest onChange without changing the setter", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ onChange }: { onChange: (value: number) => void }) =>
        useControllableState({ defaultValue: 0, onChange }),
      { initialProps: { onChange: first } }
    );
    const setter = result.current[1];

    rerender({ onChange: second });
    act(() => setter(9));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(9);
    expect(result.current[1]).toBe(setter);
  });

  it("compares with Object.is, so NaN is stable", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<number>({ defaultValue: Number.NaN, onChange })
    );

    act(() => result.current[1](Number.NaN));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the last value when switching from controlled to uncontrolled", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number | undefined }) =>
        useControllableState({ value, defaultValue: 0 }),
      { initialProps: { value: 7 as number | undefined } }
    );

    rerender({ value: undefined });
    expect(result.current[0]).toBe(7);
  });
});
