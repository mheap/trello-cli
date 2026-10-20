const base = require("./jest.config.base.js");

module.exports = {
  ...base,
  projects: ["<rootDir>/packages/*/jest.config.js", "<rootDir>/packages/trello-cli/jest.tui.config.js"],
  coverageDirectory: "<rootDir>/coverage/",
};
