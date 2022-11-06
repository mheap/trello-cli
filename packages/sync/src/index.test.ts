import hello from "../src";

describe("#hello", () => {
  it("runs", () => {
    expect(hello.hello("World")).toBe("Hello World");
  });
});
