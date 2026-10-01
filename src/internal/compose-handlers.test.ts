import { describe, expect, it, vi } from "vitest";
import { composeHandlers } from "./compose-handlers";

describe("composeHandlers", () => {
  it("runs the consumer handler before ours", () => {
    const order: string[] = [];
    const handler = composeHandlers<MouseEvent>(
      () => order.push("ours"),
      () => order.push("consumer")
    );

    handler(new MouseEvent("click"));
    expect(order).toEqual(["consumer", "ours"]);
  });

  it("skips our handler when the consumer calls preventDefault", () => {
    const ours = vi.fn();
    const handler = composeHandlers<MouseEvent>(ours, (event) => event.preventDefault());

    handler(new MouseEvent("click", { cancelable: true }));
    expect(ours).not.toHaveBeenCalled();
  });

  it("ignores defaultPrevented when asked to", () => {
    const ours = vi.fn();
    const handler = composeHandlers<MouseEvent>(ours, (event) => event.preventDefault(), {
      respectDefaultPrevented: false,
    });

    handler(new MouseEvent("click", { cancelable: true }));
    expect(ours).toHaveBeenCalledOnce();
  });

  it("tolerates a missing consumer handler", () => {
    const ours = vi.fn();
    composeHandlers<MouseEvent>(ours, undefined)(new MouseEvent("click"));
    expect(ours).toHaveBeenCalledOnce();
  });

  it("tolerates a missing internal handler", () => {
    const consumer = vi.fn();
    composeHandlers<MouseEvent>(undefined, consumer)(new MouseEvent("click"));
    expect(consumer).toHaveBeenCalledOnce();
  });

  it("passes the same event object to both", () => {
    const event = new MouseEvent("click");
    const ours = vi.fn();
    const consumer = vi.fn();
    composeHandlers(ours, consumer)(event);

    expect(ours).toHaveBeenCalledWith(event);
    expect(consumer).toHaveBeenCalledWith(event);
  });
});
