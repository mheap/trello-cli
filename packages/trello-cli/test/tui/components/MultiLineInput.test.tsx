import React from "react";
import { render } from "ink-testing-library";
import { MultiLineInput } from "../../../src/tui/components/MultiLineInput";

const flushEffects = () =>
  new Promise<void>((r) => setTimeout(r, 0)).then(
    () => new Promise<void>((r) => setTimeout(r, 0))
  );

describe("MultiLineInput", () => {
  let onChange: jest.Mock;
  let onSubmit: jest.Mock;
  let onCancel: jest.Mock;

  beforeEach(() => {
    onChange = jest.fn();
    onSubmit = jest.fn();
    onCancel = jest.fn();
  });

  function renderInput(value = "", isActive = true) {
    return render(
      <MultiLineInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isActive={isActive}
      />
    );
  }

  describe("rendering", () => {
    it("renders the value text", () => {
      const { lastFrame } = renderInput("Hello world");
      expect(lastFrame()!).toContain("Hello world");
    });

    it("renders multi-line text on separate lines", () => {
      const { lastFrame } = renderInput("Line 1\nLine 2\nLine 3");
      const output = lastFrame()!;
      expect(output).toContain("Line 1");
      expect(output).toContain("Line 2");
      expect(output).toContain("Line 3");
    });

    it("shows hints for keyboard shortcuts", () => {
      const { lastFrame } = renderInput("");
      const output = lastFrame()!;
      expect(output).toContain("[Ctrl+J] New line");
      expect(output).toContain("[Enter] Save");
      expect(output).toContain("[Esc] Cancel");
    });
  });

  describe("keyboard handling", () => {
    it("calls onSubmit when Enter is pressed", async () => {
      const inst = renderInput("My text");
      await flushEffects();
      inst.stdin.write("\r");
      expect(onSubmit).toHaveBeenCalledWith("My text");
    });

    it("calls onCancel when Escape is pressed", async () => {
      const inst = renderInput("Some text");
      await flushEffects();
      inst.stdin.write("\u001B");
      expect(onCancel).toHaveBeenCalled();
    });

    it("inserts newline on Ctrl+J", async () => {
      const inst = renderInput("Hello");
      await flushEffects();
      // Ctrl+J is character code 0x0A
      inst.stdin.write("\u000A");
      expect(onChange).toHaveBeenCalledWith("Hello\n");
    });

    it("inserts character at cursor position", async () => {
      const inst = renderInput("AB");
      await flushEffects();
      inst.stdin.write("X");
      // Cursor starts at end (position 2), so "AB" + "X" = "ABX"
      expect(onChange).toHaveBeenCalledWith("ABX");
    });

    it("handles backspace (key.delete / \\u007F)", async () => {
      const inst = renderInput("ABC");
      await flushEffects();
      // \u007F is the DEL character that physical Backspace sends
      inst.stdin.write("\u007F");
      // Cursor is at end (pos 3), so delete char before cursor: "AB"
      expect(onChange).toHaveBeenCalledWith("AB");
    });

    it("inserts tab as 2 spaces", async () => {
      const inst = renderInput("Hello");
      await flushEffects();
      inst.stdin.write("\t");
      expect(onChange).toHaveBeenCalledWith("Hello  ");
    });
  });

  describe("isActive", () => {
    it("does not respond to input when isActive is false", async () => {
      const inst = renderInput("text", false);
      await flushEffects();
      inst.stdin.write("\r");
      inst.stdin.write("X");
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
