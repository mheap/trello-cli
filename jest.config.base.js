module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testRegex: ".test.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverage: false,
  testEnvironment: "node",
  coveragePathIgnorePatterns: [],
  testTimeout: 30000,
  restoreMocks: true
};
