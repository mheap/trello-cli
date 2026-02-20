import React from "react";
import { render } from "ink-testing-library";
const { stripVTControlCharacters } = require("node:util");
import { Card } from "../../../src/tui/components/Card";
import { createMockNavContext, makeCard, makeLabel } from "../helpers";

jest.mock("../../../src/tui/state/NavigationContext", () => ({
  useNavigation: jest.fn(),
}));

import { useNavigation } from "../../../src/tui/state/NavigationContext";
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

describe("Card", () => {
  beforeEach(() => {
    mockUseNavigation.mockReturnValue(createMockNavContext() as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders card name", () => {
    const card = makeCard({ name: "Implement login page" });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    expect(lastFrame()!).toContain("Implement login page");
  });

  it("shows selection indicator when selected", () => {
    const card = makeCard({ name: "Selected Card" });
    const { lastFrame } = render(
      <Card card={card} selected={true} maxWidth={40} />
    );
    expect(lastFrame()!).toContain("> Selected Card");
  });

  it("does not show selection indicator when not selected", () => {
    const card = makeCard({ name: "Unselected Card" });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    const output = lastFrame()!;
    expect(output).toContain("Unselected Card");
    expect(output).not.toContain("> Unselected Card");
  });

  it("truncates long card names", () => {
    const longName = "This is a very long card name that should be truncated";
    const card = makeCard({ name: longName });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={24} />
    );
    const output = lastFrame()!;
    // maxWidth - 4 = 20 chars visible, truncated with "..."
    expect(output).toContain("...");
    expect(output).not.toContain("truncated");
  });

  it("renders labels with hash and name", () => {
    const card = makeCard({
      labels: [
        makeLabel({ name: "Bug", color: "red" }),
        makeLabel({ id: "l2", name: "Feature", color: "green" }),
      ],
    });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    const output = stripVTControlCharacters(lastFrame()!);
    expect(output).toContain("#Bug #Feature");
  });

  it("renders label hash without name for unnamed labels", () => {
    const card = makeCard({
      labels: [makeLabel({ name: "", color: "blue" })],
    });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    expect(lastFrame()!).toContain("#");
  });

  it("shows overdue indicator for past due dates", () => {
    const pastDate = new Date(Date.now() - 86400000 * 2).toISOString(); // 2 days ago
    const card = makeCard({ due: pastDate });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    const output = stripVTControlCharacters(lastFrame()!);
    expect(output).toContain("!! Overdue");
  });

  it("shows day count for cards due within a week", () => {
    const future = new Date(Date.now() + 86400000 * 4); // 4 days from now
    const card = makeCard({ due: future.toISOString() });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    expect(lastFrame()!).toMatch(/\dd/); // e.g. "4d"
  });

  it("shows formatted date for cards due more than a week out", () => {
    const farFuture = new Date(Date.now() + 86400000 * 30); // 30 days from now
    const card = makeCard({ due: farFuture.toISOString() });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    const output = lastFrame()!;
    // Should contain a month abbreviation
    expect(output).toMatch(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
  });

  it("does not show due info when due is null", () => {
    const card = makeCard({ due: null });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    const output = lastFrame()!;
    expect(output).not.toContain("Overdue");
    expect(output).not.toContain("Today");
    expect(output).not.toContain("!!");
  });

  it("does not show metadata row when no labels and no due date", () => {
    const card = makeCard({ labels: [], due: null });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={40} />
    );
    const output = lastFrame()!;
    expect(output).toContain("Test Card");
    expect(output).not.toContain("#");
  });

  it("shows both labels and due date together", () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const card = makeCard({
      labels: [makeLabel({ name: "Urgent", color: "red" })],
      due: pastDate,
    });
    const { lastFrame } = render(
      <Card card={card} selected={false} maxWidth={60} />
    );
    const output = stripVTControlCharacters(lastFrame()!);
    expect(output).toContain("#Urgent !! Overdue");
  });
});
