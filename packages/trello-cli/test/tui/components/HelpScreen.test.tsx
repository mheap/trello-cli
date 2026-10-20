import React from "react";
import { jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { createMockNavContext } from "../helpers";

jest.unstable_mockModule("../../../src/tui/state/NavigationContext", () => ({
  useNavigation: jest.fn(),
}));

const { HelpScreen } = await import("../../../src/tui/components/HelpScreen");
const { useNavigation } = await import("../../../src/tui/state/NavigationContext");
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

// Helper to flush useEffect — React 17 scheduler uses MessageChannel/setTimeout
const flushEffects = () =>
  new Promise((r) => setTimeout(r, 0)).then(
    () => new Promise((r) => setTimeout(r, 0))
  );

describe("HelpScreen", () => {
  beforeEach(() => {
    mockUseNavigation.mockReturnValue(createMockNavContext() as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the title", () => {
    const { lastFrame } = render(<HelpScreen onClose={jest.fn()} />);
    expect(lastFrame()!).toContain("Keyboard Shortcuts");
  });

  it("renders close hint", () => {
    const { lastFrame } = render(<HelpScreen onClose={jest.fn()} />);
    expect(lastFrame()!).toContain("Press ? or Esc to close");
  });

  it("renders all section headers", () => {
    const { lastFrame } = render(<HelpScreen onClose={jest.fn()} />);
    const output = lastFrame()!;
    expect(output).toContain("Navigation");
    expect(output).toContain("Card Actions");
    expect(output).toContain("List Actions");
    expect(output).toContain("Global");
  });

  it("renders navigation shortcuts", () => {
    const { lastFrame } = render(<HelpScreen onClose={jest.fn()} />);
    const output = lastFrame()!;
    expect(output).toContain("Navigate items in a list");
    expect(output).toContain("Select / Open details");
    expect(output).toContain("Go back / Cancel");
    expect(output).toContain("Jump to list by number");
  });

  it("renders card action shortcuts", () => {
    const { lastFrame } = render(<HelpScreen onClose={jest.fn()} />);
    const output = lastFrame()!;
    expect(output).toContain("Create new card");
    expect(output).toContain("Edit card name");
    expect(output).toContain("Edit card description");
    expect(output).toContain("Move card");
    expect(output).toContain("Toggle labels");
    expect(output).toContain("Toggle members");
    expect(output).toContain("Toggle checklist items");
    expect(output).toContain("Archive card");
    expect(output).toContain("Open card in browser");
    expect(output).toContain("Add attachment");
    expect(output).toContain("View all attachments");
  });

  it("renders list action shortcuts", () => {
    const { lastFrame } = render(<HelpScreen onClose={jest.fn()} />);
    expect(lastFrame()!).toContain("Create new list");
  });

  it("renders global shortcuts", () => {
    const { lastFrame } = render(<HelpScreen onClose={jest.fn()} />);
    const output = lastFrame()!;
    expect(output).toContain("Switch board");
    expect(output).toContain("Sync cache");
    expect(output).toContain("Quit");
  });

  it("calls onClose when ? is pressed", async () => {
    const onClose = jest.fn();
    const { stdin } = render(<HelpScreen onClose={onClose} />);
    await flushEffects();
    stdin.write("?");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when q is pressed", async () => {
    const onClose = jest.fn();
    const { stdin } = render(<HelpScreen onClose={onClose} />);
    await flushEffects();
    stdin.write("q");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = jest.fn();
    const { stdin } = render(<HelpScreen onClose={onClose} />);
    await flushEffects();
    stdin.write("\u001B");
    // Ink buffers standalone Escape to distinguish it from escape sequences.
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
