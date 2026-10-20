const base = require("../../jest.config.base.js");

module.exports = {
  ...base,
  roots: ["<rootDir>/test/tui"],
  displayName: "trello-cli-tui",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        module: "ESNext",
        moduleResolution: "bundler",
        isolatedModules: true,
      },
    }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFilesAfterEnv: ["./test/setup-tui.ts"],
};
