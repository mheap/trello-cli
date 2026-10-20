const base = require("../../jest.config.base.js");

module.exports = {
  ...base,
  roots: ["<rootDir>/test"],
  testPathIgnorePatterns: ["/test/tui/"],
  displayName: "trello-cli",
  setupFilesAfterEnv: ["./test/setup.js"],
};
