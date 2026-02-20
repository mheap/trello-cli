import React from "react";
import { render } from "ink-testing-library";
const { stripVTControlCharacters } = require("node:util");
import { Footer } from "../../../src/tui/components/Footer";
import { createMockNavContext } from "../helpers";

jest.mock("../../../src/tui/state/NavigationContext", () => ({
  useNavigation: jest.fn(),
}));

import { useNavigation } from "../../../src/tui/state/NavigationContext";
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

describe("Footer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Home view", () => {
    it("shows home shortcuts by default", () => {
      mockUseNavigation.mockReturnValue(createMockNavContext({ view: "home" }) as any);
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[Up/Down] Navigate");
      expect(output).toContain("[Enter] Select");
      expect(output).toContain("[Type] Filter");
      expect(output).toContain("[m] My cards");
      expect(output).toContain("[s] Sync");
      expect(output).toContain("[q/Esc] Quit");
    });
  });

  describe("Board view", () => {
    it("shows board shortcuts", () => {
      mockUseNavigation.mockReturnValue(createMockNavContext({ view: "board" }) as any);
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[Arrows] Navigate");
      expect(output).toContain("[n] New card");
      expect(output).toContain("[L] New list");
      expect(output).toContain("[Esc] Back");
      expect(output).toContain("[?] Help");
    });
  });

  describe("Card detail view", () => {
    it("shows card detail shortcuts", () => {
      mockUseNavigation.mockReturnValue(createMockNavContext({ view: "card-detail" }) as any);
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[e] Edit");
      expect(output).toContain("[l] Labels");
      expect(output).toContain("[d] Due date");
      expect(output).toContain("[o] Open");
      expect(output).toContain("[Esc] Close");
      expect(output).toContain("[?] Help");
    });
  });

  describe("My cards view", () => {
    it("shows my cards shortcuts", () => {
      mockUseNavigation.mockReturnValue(createMockNavContext({ view: "my-cards" }) as any);
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[Up/Down] Navigate");
      expect(output).toContain("[Enter] View");
      expect(output).toContain("[Esc] Back");
    });
  });

  describe("Mode-specific shortcuts", () => {
    it("shows edit-desc mode shortcuts", () => {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({ view: "board", mode: "edit-desc" }) as any
      );
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[Enter] Save");
      expect(output).toContain("[Esc] Cancel");
      expect(output).toContain("[Ctrl+J] New line");
    });

    it("shows toggle-label mode shortcuts", () => {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({ view: "board", mode: "toggle-label" }) as any
      );
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[1-9] Toggle");
      expect(output).toContain("[Esc] Close");
    });

    it("shows toggle-member mode shortcuts", () => {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({ view: "board", mode: "toggle-member" }) as any
      );
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[1-9] Toggle");
      expect(output).toContain("[Esc] Close");
    });

    it("shows toggle-checklist mode shortcuts", () => {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({ view: "board", mode: "toggle-checklist" }) as any
      );
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[1-9/a-z] Select/Toggle");
      expect(output).toContain("[Left/Right] Page");
      expect(output).toContain("[i] Add item");
      expect(output).toContain("[Esc] Back");
    });

    it("shows view-attachments mode shortcuts", () => {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({ view: "board", mode: "view-attachments" }) as any
      );
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[Esc] Close");
    });

    it("shows generic confirm/cancel for other modes", () => {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({ view: "board", mode: "create-card" }) as any
      );
      const { lastFrame } = render(<Footer />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("[Enter] Confirm");
      expect(output).toContain("[Esc] Cancel");
    });
  });
});
