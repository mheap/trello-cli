import React from "react";
import { jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { createMockNavContext } from "../helpers";

jest.unstable_mockModule("../../../src/tui/state/NavigationContext", () => ({
  useNavigation: jest.fn(),
}));

const { ConfirmDialog } = await import("../../../src/tui/components/ConfirmDialog");
const { useNavigation } = await import("../../../src/tui/state/NavigationContext");
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

// Helper to flush useEffect — React 17 scheduler uses MessageChannel/setTimeout
const flushEffects = () =>
  new Promise((r) => setTimeout(r, 0)).then(
    () => new Promise((r) => setTimeout(r, 0))
  );

describe("ConfirmDialog", () => {
  beforeEach(() => {
    mockUseNavigation.mockReturnValue(createMockNavContext() as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the confirmation message", () => {
    const { lastFrame } = render(
      <ConfirmDialog
        message="Are you sure you want to delete this card?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(lastFrame()!).toContain("Are you sure you want to delete this card?");
  });

  it("renders Confirm title", () => {
    const { lastFrame } = render(
      <ConfirmDialog
        message="Delete?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(lastFrame()!).toContain("Confirm");
  });

  it("shows y/n options", () => {
    const { lastFrame } = render(
      <ConfirmDialog
        message="Delete?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    const output = lastFrame()!;
    expect(output).toContain("[y] Yes");
    expect(output).toContain("[any key] No");
  });

  it("calls onConfirm when y is pressed", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { stdin } = render(
      <ConfirmDialog
        message="Delete?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await flushEffects();
    stdin.write("y");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onConfirm when Y is pressed", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { stdin } = render(
      <ConfirmDialog
        message="Delete?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await flushEffects();
    stdin.write("Y");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when any other key is pressed", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { stdin } = render(
      <ConfirmDialog
        message="Delete?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await flushEffects();
    stdin.write("n");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("treats space as cancel", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { stdin } = render(
      <ConfirmDialog
        message="Delete?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await flushEffects();
    stdin.write(" ");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
